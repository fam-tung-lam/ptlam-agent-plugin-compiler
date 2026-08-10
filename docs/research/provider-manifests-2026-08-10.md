# Манифесты GitHub Copilot CLI, Gemini CLI и Kimi Code CLI

Дата исследования: 2026-08-10  
Дата доступа ко всем внешним источникам: 2026-08-10  
Текущий проект: commit `1ff3334e015896a0e97bc1c54b1f96e6ef9827ab`

## Краткий вывод

| Target             | Нужен manifest для installable plugin/extension          | Рекомендуемый generated output               | Работает общий `skills/`                     |
| ------------------ | -------------------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| GitHub Copilot CLI | Да для plugin install; нет для отдельной установки Skill | `plugin.json` по Agent Plugins 1.0.0         | Да, это фиксированный путь стандарта         |
| Gemini CLI         | Да                                                       | `gemini-extension.json`                      | Да, extension автоматически читает `skills/` |
| Kimi Code CLI      | Да                                                       | `kimi.plugin.json` с `"skills": "./skills/"` | Да, только при явной ссылке из manifest      |

Если выбран соответствующий target, компилятор должен генерировать его manifest.
Исключение только практическое: Copilot CLI уже умеет обнаруживать существующий
`.claude-plugin/plugin.json`, поэтому repository, скомпилированный для Claude,
может работать в Copilot и без нового файла. Но это связывает поддержку Copilot
с выбором Claude. Для независимого provider contract лучше генерировать
переносимый корневой `plugin.json`.

## Что уже делает текущий компилятор

Это локальные факты, а не внешние требования.

1. Компилятор всегда строит общий полный tree `skills/`; каждый опубликованный
   Skill является непосредственным child `skills/<id>/SKILL.md`
   ([`compile-shared-skills.ts:242-297`](../../src/compiler/rendering/compile-shared-skills.ts)).
2. Затем он объединяет общий tree с fragments выбранных provider adapters
   ([`agent-plugin-compiler.ts:64-75`](../../src/compiler/agent-plugin-compiler.ts)).
3. Claude adapter владеет `.claude-plugin/plugin.json` и
   `.claude-plugin/marketplace.json`; его manifest перечисляет опубликованные
   Skill paths
   ([`claude-provider.ts:15-23`](../../src/providers/claude-provider.ts),
   [`claude-provider.ts:46-58`](../../src/providers/claude-provider.ts)).
4. Codex adapter владеет `.codex-plugin/plugin.json` и указывает
   `"skills": "./skills/"`
   ([`codex-provider.ts:14-20`](../../src/providers/codex-provider.ts),
   [`codex-provider.ts:43-54`](../../src/providers/codex-provider.ts)).
5. Built-in registry пока содержит только Claude и Codex
   ([`provider-registry.ts:79-94`](../../src/providers/provider-registry.ts)).

Такая архитектура уже подходит всем трем новым targets: общий renderer не нужно
дублировать, а каждый новый adapter должен владеть только своим точным manifest.

## 1. GitHub Copilot CLI

### Официальный контракт

Обычный Copilot CLI plugin устанавливается через `copilot plugin install` из
marketplace, GitHub repository, Git URL или local path. Официальный CLI
reference говорит, что plugin directory содержит как минимум `plugin.json`;
единственное required field в Copilot-native режиме — `name`. Metadata и
component path fields являются optional
([CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference),
[пошаговое создание plugin](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating)).

Copilot проверяет manifest locations в таком порядке:

1. `.plugin/plugin.json`;
2. `plugin.json`;
3. `.github/plugin/plugin.json`;
4. `.claude-plugin/plugin.json`.

Default component directory для Skills — `skills/`. Manifest также может
указывать `agents`, `skills`, `commands`, `hooks`, `extensions`, `mcpServers` и
`lspServers`; metadata включает `description`, `version`, `author`, `homepage`,
`repository`, `license`, `keywords`, `category` и `tags`
([file locations и component fields](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference#pluginjson)).

Copilot CLI отдельно умеет установить один Skill через
`copilot plugins install --skill`. Это не plugin install, не использует
marketplace и не требует plugin manifest
([install options](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference#copilot-plugins-install-options)).

### Предпочтительный контракт: Agent Plugins 1.0.0

Copilot CLI поддерживает portable Agent Plugins/Open Plugin Spec. Наличие
canonical `$schema` в корневом `plugin.json` включает этот режим. Portable
schema закрыта: допустимы только `$schema`, `name`, `version`, `description`,
`author`, `homepage`, `repository`, `license`, `keywords` и namespaced
`extensions`
([Copilot Open Plugin Spec support](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference#open-plugin-spec-support),
[normative manifest contract](https://agent-plugins.org/plugin-authors/manifest),
[JSON Schema 1.0.0](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json)).

В этом режиме поле `skills` добавлять нельзя. Skills обнаруживаются в
фиксированном `skills/`, только среди непосредственных child directories; более
глубокие descendants не становятся отдельными Skills
([Agent Plugins Skills](https://agent-plugins.org/plugin-authors/skills)). Это
точно совпадает с текущим output tree компилятора и сохраняет вложенные copies
required Skills внутренними для parent Skill.

Рекомендуемый output:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "example-plugin",
  "version": "1.0.0",
  "description": "Example plugin",
  "author": { "name": "Example Maintainer" },
  "homepage": "https://example.com",
  "repository": "https://github.com/example/example-plugin",
  "license": "MIT",
  "keywords": ["agent", "skills"]
}
```

### Нужно ли генерировать

**Да для независимой first-class поддержки**, но provider лучше понимать как
portable `agent-plugins`, а не как Copilot-only формат. Он должен генерировать
root `plugin.json` с `$schema` и без `skills`.

Строго технически новый файл не нужен, когда Claude provider уже выбран: Copilot
находит `.claude-plugin/plugin.json`, а текущие Claude fields и Skill paths
входят в документированный Copilot-native contract. Однако reliance на этот
fallback создает скрытую связь `copilot -> claude` и не дает выбрать Copilot
отдельно.

`marketplace.json` не нужен для direct repository/local install. Его стоит
генерировать только если продукт отдельно обещает Copilot marketplace
distribution; это другой output contract.

### Не смешивать с другими поверхностями Copilot

- Repository Skills для Copilot cloud agent, code review, CLI, desktop app и VS
  Code agent mode живут в `.github/skills`, `.claude/skills` или
  `.agents/skills`. Корневой `skills/` становится Copilot-visible именно как
  component установленного plugin
  ([Adding agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills)).
- Copilot CLI устанавливает plugin императивно. Copilot cloud agent использует
  тот же plugin ecosystem, но enablement задается декларативно через
  `.github/copilot/settings.json`; сам generated manifest не включает plugin
  автоматически
  ([About GitHub Copilot plugins](https://docs.github.com/en/copilot/concepts/agents/about-plugins)).
- Это не manifest VS Code extension и не конфигурация отдельного third-party
  coding agent.

## 2. Gemini CLI

### Официальный контракт

Gemini CLI устанавливает extension из GitHub URL или local path командой
`gemini extensions install`; при install создается copy под
`~/.gemini/extensions`. Каждый extension обязан иметь `gemini-extension.json` в
собственном root
([Extension reference](https://geminicli.com/docs/extensions/reference/)).

Runtime source проверяет наличие root file и отклоняет config без `name` или
`version`
([`extension-manager.ts` at verified commit](https://github.com/google-gemini/gemini-cli/blob/cf22ac7e86f3dcf528e3ae591fec1c03090a49f8/packages/cli/src/config/extension-manager.ts#L1017-L1044)).
Официальная документация также описывает `description`, `migratedTo`,
`mcpServers`, `contextFileName`, `excludeTools`, `plan`, `settings` и `themes`.

Другие components используют conventions рядом с manifest:

- `commands/` для custom commands;
- `hooks/hooks.json` для hooks;
- `skills/<name>/SKILL.md` для Agent Skills;
- `agents/` для sub-agents;
- `policies/` для policy rules.

В `gemini-extension.json` нет поля `skills`: extension loader автоматически
читает root `skills/`. Это подтверждается official skills extension example, чей
manifest содержит только `name` и `version`, а Skill лежит рядом в
`skills/greeter/SKILL.md`
([official example](https://github.com/google-gemini/gemini-cli/tree/cf22ac7e86f3dcf528e3ae591fec1c03090a49f8/packages/cli/src/commands/extensions/examples/skills),
[Agent skills in extensions](https://geminicli.com/docs/extensions/reference/#agent-skills)).

Для gallery/release manifest также должен находиться в absolute root repository
или release archive
([Release extensions](https://geminicli.com/docs/extensions/releasing/)).

### Работает ли общий `skills/`

**Да, внутри installed extension.** Текущий generated root `skills/` совпадает с
extension convention.

Без extension manifest тот же root directory не является Gemini workspace Skills
directory: обычная project discovery смотрит `.gemini/skills/` и
`.agents/skills/`. Это отдельный способ распространения отдельных Skills
([Creating Agent Skills](https://geminicli.com/docs/cli/creating-skills/)).

### Нужно ли генерировать

**Да.** Gemini provider должен владеть root `gemini-extension.json` и как
минимум выводить:

```json
{
  "name": "example-plugin",
  "version": "1.0.0",
  "description": "Example plugin"
}
```

Не нужно добавлять выдуманное поле `skills`; directory convention уже является
частью extension contract. Не следует автоматически переносить Claude/Codex
fields, которых нет в Gemini manifest contract.

## 3. Kimi Code CLI (`kimi.plugin.json`)

### Какой именно Kimi

Имя `kimi.plugin.json` относится к нынешнему TypeScript-продукту **Kimi Code
CLI** из `MoonshotAI/kimi-code`. Старый Python-проект `MoonshotAI/kimi-cli`
использует другой `plugin.json` и другой tools-oriented contract. Этот отчет
рассматривает Kimi Code CLI, соответствующий указанному filename.

### Официальный контракт

Kimi Code CLI устанавливает plugins из local directory, ZIP URL или GitHub URL
через `/plugins install`; local installs копируются в
`$KIMI_CODE_HOME/plugins/managed/<id>/` и действуют per-user
([Plugins: installation](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/plugins.html#installation-and-management)).

Manifest обязателен и может находиться в одном из двух мест:

1. `<plugin_root>/kimi.plugin.json`;
2. `<plugin_root>/.kimi-plugin/plugin.json`.

При наличии обоих root `kimi.plugin.json` имеет precedence. Единственное
обязательное поле — `name`, соответствующее `[a-z0-9][a-z0-9_-]{0,63}`
([Plugin Manifest](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/plugins.html#plugin-manifest)).
Тот же алгоритм и ошибка при отсутствии обоих manifests видны в runtime source
([`manifest.ts` at verified commit](https://github.com/MoonshotAI/kimi-code/blob/0401ec4286f37929d1d298527c05f5351850bf8a/packages/agent-core/src/plugin/manifest.ts)).

Supported fields:

- display metadata: `version`, `description`, `keywords`, `author`, `homepage`,
  `license`, `interface`;
- components и instructions: `skills`, `agents`, `sessionStart.skill`,
  `skillInstructions`, `systemPrompt`, `systemPromptPath`, `mcpServers`,
  `hooks`, `commands`.

Runtime принимает `author` string либо object, но сохраняет из object только
`name` и `email`; `repository` не входит в текущий typed manifest
([manifest types](https://github.com/MoonshotAI/kimi-code/blob/0401ec4286f37929d1d298527c05f5351850bf8a/packages/agent-core/src/plugin/types.ts)).

### Работает ли общий `skills/`

**Да, но только с явным `"skills": "./skills/"`.** Поле принимает одну строку
или массив `./` paths внутри plugin root. Если `skills` отсутствует, loader ищет
только root `SKILL.md`; он не подхватывает root `skills/` автоматически
([official field semantics](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/plugins.html#plugin-manifest),
[runtime parser](https://github.com/MoonshotAI/kimi-code/blob/0401ec4286f37929d1d298527c05f5351850bf8a/packages/agent-core/src/plugin/manifest.ts#L75-L84)).

Обычная project-level discovery без plugin смотрит `.kimi-code/skills/` и
`.agents/skills/`, а не root `skills/`
([Kimi Agent Skills locations](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/skills.html#skill-locations)).

### Нужно ли генерировать

**Да.** Kimi provider должен владеть root `kimi.plugin.json`. Минимальный
полезный mapping из текущего authored `plugin/plugin.yml`:

```json
{
  "name": "example-plugin",
  "version": "1.0.0",
  "description": "Example plugin",
  "keywords": ["agent", "skills"],
  "author": { "name": "Example Maintainer" },
  "homepage": "https://example.com",
  "license": "MIT",
  "skills": "./skills/"
}
```

Не следует выводить `repository` или `author.url` как будто они принадлежат Kimi
contract. `sessionStart`, `skillInstructions`, system prompt, MCP, hooks,
commands и agents требуют новых authored inputs и не должны выводиться из
несвязанных полей текущей schema.

## Рекомендуемая граница реализации

| Adapter / target                 | Exact owned path        | Поля из текущего `plugin/plugin.yml`                                                          | Что не генерировать автоматически                               |
| -------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Portable Agent Plugins / Copilot | `plugin.json`           | `$schema`, name, version, description, author, homepage, repository, license, keywords        | `skills`; marketplace; client extensions                        |
| Gemini                           | `gemini-extension.json` | name, version, description                                                                    | skills path; MCP/settings/themes без authored source            |
| Kimi Code                        | `kimi.plugin.json`      | name, version, description, keywords, author name/email, homepage, license, `skills` constant | repository, author URL, session start, tools/MCP/hooks/commands |

Сначала следует добавить conformance fixtures, привязанные к приведенным
official contracts, затем adapters и только после этого CLI identifiers. Общий
`compileSharedSkills` менять не нужно.

## Уверенность и неопределенности

| Вывод                                                                     | Уверенность | Причина / конфликт                                                                                   |
| ------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| Copilot принимает existing `.claude-plugin/plugin.json`                   | Высокая     | Это прямо указано в текущем official lookup order                                                    |
| Для независимого Copilot target лучше root Open Plugin Spec `plugin.json` | Высокая     | Copilot прямо поддерживает schema 1.0.0, а текущий `skills/` совпадает с fixed layout                |
| Gemini требует root `gemini-extension.json` с name/version                | Высокая     | Совпадают docs и runtime source                                                                      |
| Gemini extension автоматически читает `skills/`                           | Высокая     | Совпадают reference, runtime и official example                                                      |
| Kimi требует `kimi.plugin.json` и explicit `skills` path                  | Высокая     | Совпадают docs и runtime parser                                                                      |
| Долговечность Kimi optional fields                                        | Средняя     | Это молодой, активно меняющийся Kimi Code plugin contract; нужны version-pinned conformance fixtures |

Есть одно кажущееся противоречие в документации Copilot: CLI authoring guide
требует `plugin.json`, тогда как Copilot SDK `--plugin-dir` documentation
допускает directory только с root `SKILL.md`. Это разные входы. Для обычного
`copilot plugin install` и распространяемого agent plugin следует применять CLI
manifest contract, а не SDK-only shortcut
([CLI guide](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating),
[SDK plugin directories](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/plugin-directories)).
