import { readFile } from 'fs/promises'
import { join } from 'path'
import { Project, SyntaxKind, type CallExpression, type Node } from 'ts-morph'
import type { CollectionSchema, CollectionFieldSchema, CollectionFieldType } from '../shared/types'

function resolveZodType(callText: string): CollectionFieldType {
  if (callText.startsWith('z.string')) return 'string'
  if (callText.startsWith('z.number')) return 'number'
  if (callText.startsWith('z.boolean')) return 'boolean'
  if (callText.startsWith('z.date') || callText.startsWith('z.coerce.date')) return 'date'
  if (callText.startsWith('z.enum')) return 'enum'
  return 'unknown'
}

function getBaseCall(node: Node): string {
  const text = node.getText()
  const match = text.match(/^(z\.(?:coerce\.)?[a-zA-Z]+)/)
  return match ? match[1] : ''
}

function extractEnumValues(node: Node): string[] | undefined {
  const text = node.getText()
  const match = text.match(/z\.enum\(\s*\[([\s\S]*?)\]\s*\)/)
  if (!match) return undefined
  const inner = match[1]
  const values: string[] = []
  const re = /["']([^"']+)["']/g
  let m: RegExpExecArray | null
  while ((m = re.exec(inner)) !== null) {
    values.push(m[1])
  }
  return values.length > 0 ? values : undefined
}

function hasChainedCall(text: string, method: string): boolean {
  return new RegExp(`\\.${method}\\s*\\(`).test(text)
}

function extractDefaultValue(text: string): unknown | undefined {
  const match = text.match(/\.default\(\s*([\s\S]*?)\s*\)/)
  if (!match) return undefined
  const raw = match[1]
  try {
    return new Function(`return (${raw})`)()
  } catch {
    return raw
  }
}

function extractDescription(text: string): string | undefined {
  const match = text.match(/\.describe\(\s*["'](.+?)["']\s*\)/)
  return match ? match[1] : undefined
}

function parseField(name: string, fieldNode: Node): CollectionFieldSchema {
  const text = fieldNode.getText()
  const baseCall = getBaseCall(fieldNode)
  const type = resolveZodType(baseCall)

  const field: CollectionFieldSchema = {
    name,
    type,
    required: true
  }

  if (hasChainedCall(text, 'optional')) {
    field.required = false
  }

  const defaultVal = extractDefaultValue(text)
  if (defaultVal !== undefined) {
    field.default = defaultVal
    field.required = false
  }

  const description = extractDescription(text)
  if (description) {
    field.description = description
  }

  if (type === 'enum') {
    const enumValues = extractEnumValues(fieldNode)
    if (enumValues) {
      field.enumValues = enumValues
    }
  }

  return field
}

function findCollectionVariable(
  sourceFile: ReturnType<Project['createSourceFile']>,
  collectionName: string
): Node | null {
  const collectionsExport = sourceFile.getVariableDeclaration('collections')
  if (!collectionsExport) return null

  const init = collectionsExport.getInitializer()
  if (!init || init.getKind() !== SyntaxKind.ObjectLiteralExpression) return null

  const obj = init.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
  const prop = obj.getProperty(collectionName)
  if (!prop) return null

  if (prop.getKind() === SyntaxKind.PropertyAssignment) {
    const propInit = prop.asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializer()
    if (propInit?.getKind() === SyntaxKind.Identifier) {
      const varName = propInit.getText()
      const varDecl = sourceFile.getVariableDeclaration(varName)
      return varDecl?.getInitializer() ?? null
    }
    return propInit ?? null
  }

  if (prop.getKind() === SyntaxKind.ShorthandPropertyAssignment) {
    const varName = prop.asKindOrThrow(SyntaxKind.ShorthandPropertyAssignment).getName()
    const varDecl = sourceFile.getVariableDeclaration(varName)
    return varDecl?.getInitializer() ?? null
  }

  return null
}

function extractSchemaObject(defineCollectionCall: Node): Node | null {
  if (defineCollectionCall.getKind() !== SyntaxKind.CallExpression) return null

  const call = defineCollectionCall as CallExpression
  const args = call.getArguments()
  if (args.length === 0) return null

  const configObj = args[0]
  if (configObj.getKind() !== SyntaxKind.ObjectLiteralExpression) return null

  const obj = configObj.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
  const schemaProp = obj.getProperty('schema')
  if (!schemaProp) return null

  const schemaInit = schemaProp
    .asKindOrThrow(SyntaxKind.PropertyAssignment)
    .getInitializer()

  return schemaInit ?? null
}

function extractFieldsFromZodObject(schemaNode: Node): CollectionFieldSchema[] {
  if (!schemaNode.getText().startsWith('z.object(')) return []
  if (schemaNode.getKind() !== SyntaxKind.CallExpression) return []

  const args = (schemaNode as CallExpression).getArguments()
  if (args.length === 0) return []

  const objArg = args[0]
  if (objArg.getKind() !== SyntaxKind.ObjectLiteralExpression) return []

  const obj = objArg.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
  const fields: CollectionFieldSchema[] = []

  for (const prop of obj.getProperties()) {
    if (prop.getKind() !== SyntaxKind.PropertyAssignment) continue
    const pa = prop.asKindOrThrow(SyntaxKind.PropertyAssignment)
    const fieldName = pa.getName()
    const fieldInit = pa.getInitializer()
    if (!fieldInit) continue

    fields.push(parseField(fieldName, fieldInit))
  }

  return fields
}

export function parseCollectionSchema(
  source: string,
  collectionName: string
): CollectionSchema | null {
  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile('config.ts', source)

  const collectionNode = findCollectionVariable(sourceFile, collectionName)
  if (!collectionNode) return null

  const schemaNode = extractSchemaObject(collectionNode)
  if (!schemaNode) return null

  const fields = extractFieldsFromZodObject(schemaNode)

  return { name: collectionName, fields }
}

const CONFIG_FILENAMES = ['src/content/config.ts', 'src/content.config.ts']

export async function loadCollectionSchema(
  projectPath: string,
  collectionName: string
): Promise<CollectionSchema | null> {
  for (const filename of CONFIG_FILENAMES) {
    try {
      const source = await readFile(join(projectPath, filename), 'utf-8')
      const schema = parseCollectionSchema(source, collectionName)
      if (schema) return schema
    } catch {
      continue
    }
  }
  return null
}
