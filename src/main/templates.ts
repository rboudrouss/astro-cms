import type { TemplateInfo } from '../shared/types'

export type TemplateFiles = {
  [relativePath: string]: string
}

export type TemplateDefinition = TemplateInfo & {
  files: (projectName: string, themeName: string) => TemplateFiles
}

const blogTemplate: TemplateDefinition = {
  id: 'blog',
  name: 'Blog',
  description: 'Un blog personnel avec articles et pages statiques.',
  themeName: 'theme-blog',
  files: (projectName, themeName) => ({
    'package.json': JSON.stringify(
      {
        name: projectName,
        version: '0.0.1',
        private: true,
        scripts: {
          dev: 'astro dev',
          build: 'astro build',
          preview: 'astro preview'
        },
        dependencies: {
          astro: '^4.0.0'
        }
      },
      null,
      2
    ),
    'astro-cms.config.ts': `import { defineProject } from "@astro-cms/runtime";
import myTheme from "./src/themes/${themeName}/astro-cms.theme";

export default defineProject({
  theme: myTheme,
  pagesDir: "src/pages",
  contentDir: "src/content",
  assetsDir: "src/assets",
});
`,
    [`src/themes/${themeName}/astro-cms.theme.ts`]: `import { defineTheme } from "@astro-cms/theme";

export default defineTheme({
  name: "${themeName}",
  layoutsDir: "./layouts",
  blocksDir: "./blocks",
  variables: {
    mainColor: { type: "color", default: "#1a1a2e" },
    accentColor: { type: "color", default: "#e94560" },
  },
});
`,
    [`src/themes/${themeName}/layouts/.gitkeep`]: '',
    [`src/themes/${themeName}/blocks/.gitkeep`]: '',
    'src/pages/index.mdx': `---
layout: ../themes/${themeName}/layouts/Base.astro
title: Accueil
description: Bienvenue sur ${projectName}
---

# Bienvenue sur ${projectName}

Ceci est votre nouveau blog propulsé par Astro et astro-cms.
`,
    'src/content/.gitkeep': '',
    'src/assets/.gitkeep': ''
  })
}

const vitrineAssoTemplate: TemplateDefinition = {
  id: 'vitrine-asso',
  name: 'Vitrine association',
  description: "Site vitrine pour une association étudiante avec pages d'accueil, à propos et événements.",
  themeName: 'theme-vitrine',
  files: (projectName, themeName) => ({
    'package.json': JSON.stringify(
      {
        name: projectName,
        version: '0.0.1',
        private: true,
        scripts: {
          dev: 'astro dev',
          build: 'astro build',
          preview: 'astro preview'
        },
        dependencies: {
          astro: '^4.0.0'
        }
      },
      null,
      2
    ),
    'astro-cms.config.ts': `import { defineProject } from "@astro-cms/runtime";
import myTheme from "./src/themes/${themeName}/astro-cms.theme";

export default defineProject({
  theme: myTheme,
  pagesDir: "src/pages",
  contentDir: "src/content",
  assetsDir: "src/assets",
});
`,
    [`src/themes/${themeName}/astro-cms.theme.ts`]: `import { defineTheme } from "@astro-cms/theme";

export default defineTheme({
  name: "${themeName}",
  layoutsDir: "./layouts",
  blocksDir: "./blocks",
  variables: {
    mainColor: { type: "color", default: "#2d3436" },
    accentColor: { type: "color", default: "#0984e3" },
  },
});
`,
    [`src/themes/${themeName}/layouts/.gitkeep`]: '',
    [`src/themes/${themeName}/blocks/.gitkeep`]: '',
    'src/pages/index.mdx': `---
layout: ../themes/${themeName}/layouts/Base.astro
title: Accueil
description: Bienvenue sur le site de notre association
---

# Bienvenue sur ${projectName}

Découvrez notre association et nos activités.
`,
    'src/pages/a-propos.mdx': `---
layout: ../themes/${themeName}/layouts/Base.astro
title: À propos
description: En savoir plus sur notre association
---

# À propos

Présentation de notre association.
`,
    'src/content/.gitkeep': '',
    'src/assets/.gitkeep': ''
  })
}

const templates: TemplateDefinition[] = [blogTemplate, vitrineAssoTemplate]

export function getTemplates(): TemplateInfo[] {
  return templates.map(({ id, name, description, themeName }) => ({
    id,
    name,
    description,
    themeName
  }))
}

export function getTemplateDefinition(templateId: string): TemplateDefinition | undefined {
  return templates.find((t) => t.id === templateId)
}
