import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkRehype from 'remark-rehype'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import rehypeRemark from 'rehype-remark'

const mdToHtml = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeStringify)

const htmlToMd = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeRemark)
  .use(remarkStringify, { bullet: '-', emphasis: '*', strong: '*' })

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await mdToHtml.process(markdown)
  return String(result)
}

export async function htmlToMarkdown(html: string): Promise<string> {
  const result = await htmlToMd.process(html)
  return String(result)
}
