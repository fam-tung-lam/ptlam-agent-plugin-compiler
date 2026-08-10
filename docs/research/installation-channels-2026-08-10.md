# Каналы установки Agent Plugin Compiler

Дата исследования: 2026-08-10  
Дата доступа ко всем внешним источникам: 2026-08-10  
Текущий проект: commit `584785045d5225d72e3e743309881e21ba08d536`  
Референс `local/agentplugins`: commit `f3d9c439680d26d4316c1ed214ae9a82a2127a2a`

## Краткий вывод

Каналы стоит добавлять не одновременно, а в таком порядке:

| Приоритет      | Канал                  | Решение                                                     | Почему                                                                                                                 |
| -------------- | ---------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1              | npm + `npm exec`/`npx` | Оставить каноническим                                       | Это нативный канал текущего Node/TypeScript-пакета и уже существующая цепочка поставки                                 |
| 1              | Bun + `bunx`           | Добавить как способ потребления того же npm-пакета          | Отдельная публикация не нужна; Node shebang сохраняет текущую семантику выполнения                                     |
| 2              | Homebrew tap           | Добавить после первого stable-релиза                        | Formula может брать точный npm tarball с SHA-256 и зависеть от Homebrew `node`                                         |
| 3              | `curl` installer       | Не добавлять до появления проверенных standalone-бинарников | Сейчас GitHub Releases не содержат исполняемых assets, а shell-wrapper вокруг `npm install -g` не дает нового покрытия |
| Не планировать | PyPI + `uv tool`/`uvx` | Не добавлять для текущей реализации                         | `uv` устанавливает команды из Python packages, а продукт является Node package                                         |

Главный принцип: **один релиз npm остается источником версии и содержимого**.
Bun использует его напрямую, а Homebrew переупаковывает ровно тот же versioned
npm tarball. Новая независимая сборка появляется только если продукт сознательно
решит поддерживать Node-free standalone CLI.

## Что наблюдается в текущем проекте

Это локальные факты, а не внешние рекомендации.

1. Пакет называется `@fam-tung-lam/ptlam-agent-plugin-compiler`, имеет тип ESM,
   требует Node `>=22.6.0` и экспортирует команду `plugin-compiler` через
   `dist/bin.js` ([`package.json:2-40`](../../package.json)).
2. Публикуемый набор уже содержит готовый `dist/**`; сборка на машине
   потребителя не нужна ([`package.json:27-31`](../../package.json)).
3. CLI имеет `#!/usr/bin/env node`, а build отдельно проверяет shebang и
   executable bit ([`src/bin.ts:1`](../../src/bin.ts),
   [`scripts/finalize-build.ts:3-10`](../../scripts/finalize-build.ts)).
4. README уже рекомендует exact dev dependency через npm и запуск локального bin
   через `npm exec` ([`README.md:85-92`](../../README.md),
   [`README.md:195-204`](../../README.md)).
5. CD публикует протестированный npm tarball через OIDC из защищенного
   `npm-release` environment и затем проверяет npm release
   ([`.github/workflows/cd.yml:74-160`](../../.github/workflows/cd.yml)).
6. Release-процесс уже проверяет integrity, shasum, provenance и signatures
   ([`docs/RELEASE.md:125-138`](../RELEASE.md)). Добавление каналов не должно
   ослабить эту цепочку или создать второго владельца версии.
7. На момент проверки npm registry содержит `0.1.0-alpha.1` и `0.1.0-alpha.2`:
   tag `next` указывает на `alpha.2`, а `latest` все еще на `alpha.1`
   ([npm registry metadata](https://registry.npmjs.org/@fam-tung-lam%2Fptlam-agent-plugin-compiler)).
   Следовательно, до stable-релиза команды для пробного запуска должны
   использовать `@next` или точную версию, а не `@latest`.
8. GitHub release `v0.1.0-alpha.2` является prerelease и не содержит assets
   ([GitHub Releases API](https://api.github.com/repos/fam-tung-lam/ptlam-agent-plugin-compiler/releases/tags/v0.1.0-alpha.2)).
   Поэтому сейчас `curl` и binary-based Formula скачивать нечего.

## Что дает референс AgentPlugins

Референс полезен как карта возможных каналов, но не как готовая реализация.

- Он документирует npm, Bun, Homebrew и `curl`
  ([`installation.md:9-48`](../../local/agentplugins/docs/guide/installation.md)).
- Он строит Bun executables для нескольких OS/architecture, прикрепляет archives
  к GitHub Release и обновляет отдельный tap
  ([`release.yml:80-168`](../../local/agentplugins/.github/workflows/release.yml),
  [`release.yml:170-312`](../../local/agentplugins/.github/workflows/release.yml)).
- Он показывает полезные идеи: platform detection, temporary directory, version
  selection, checksum и post-install smoke check
  ([`install.sh:44-68`](../../local/agentplugins/scripts/install.sh),
  [`install.sh:93-146`](../../local/agentplugins/scripts/install.sh),
  [`install.sh:188-212`](../../local/agentplugins/scripts/install.sh)).

При этом в текущем snapshot есть причины ничего не копировать:

- release workflow собирает assets с именами вроде
  `agentplugins-aarch64-apple-darwin`, а installer запрашивает
  `agentplugins-darwin-arm64`; это разные контракты
  ([`release.yml:85-106`](../../local/agentplugins/.github/workflows/release.yml),
  [`install.sh:117-122`](../../local/agentplugins/scripts/install.sh));
- release workflow записывает в каждый `.sha256` только hash, затем склеивает
  эти строки, тогда как installer ищет в checksum-файле имя бинарника
  ([`release.yml:147-158`](../../local/agentplugins/.github/workflows/release.yml),
  [`release.yml:201-207`](../../local/agentplugins/.github/workflows/release.yml),
  [`install.sh:148-152`](../../local/agentplugins/scripts/install.sh));
- installer продолжает установку, когда checksum-файл или нужная запись
  отсутствует, и распаковывает archive до проверки содержимого
  ([`install.sh:161-185`](../../local/agentplugins/scripts/install.sh));
- binary build использует плавающий `bun-version: latest`, что ухудшает
  воспроизводимость
  ([`release.yml:121-125`](../../local/agentplugins/.github/workflows/release.yml)).

Эти расхождения не означают, что сами каналы плохие. Они показывают, почему для
текущего проекта нужны собственные контракты артефактов, fail-closed проверки и
независимые smoke tests.

## 1. npm, `npm exec` и `npx`

### Решение

npm остается каноническим каналом. Отдельного `npx`-релиза не существует: `npx`
использует механизм `npm exec`, который находит локальный bin или временно
получает package в npm cache
([npm exec](https://docs.npmjs.com/cli/v11/commands/npm-exec/)). Поле `bin`
создает локальные и global command shims
([package.json `bin`](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#bin)).

### Рекомендуемые команды

Для поддерживаемого plugin-проекта:

```bash
npm install --save-dev --save-exact \
  @fam-tung-lam/ptlam-agent-plugin-compiler@next
npm exec -- plugin-compiler validate
```

`--save-exact` фиксирует фактически разрешенную версию в `package.json`;
lockfile фиксирует весь dependency graph. После stable-релиза документация
должна заменить `@next` на точную stable-версию или оставить команду установки с
`--save-exact`.

Для одноразовой проверки prerelease без изменения проекта:

```bash
npm exec --yes \
  --package=@fam-tung-lam/ptlam-agent-plugin-compiler@0.1.0-alpha.2 \
  -- plugin-compiler --help
```

Эквивалентная короткая форма возможна, потому что package имеет ровно один
`bin`:

```bash
npx --yes @fam-tung-lam/ptlam-agent-plugin-compiler@0.1.0-alpha.2 --help
```

Точную версию особенно важно указывать в CI. Интерактивный prompt `npx` снижает
риск установки опечатанного имени; `--yes` уместен только когда полное scoped
name и версия уже проверены
([npm exec](https://docs.npmjs.com/cli/v11/commands/npm-exec/)).

### Что менять

1. Сохранить current npm package, `bin`, Node engine и готовый `dist`.
2. Добавить в README разделы «project install» и «one-off trial»; global install
   оставить второстепенным, потому что compiler должен быть версионирован вместе
   с plugin-проектом.
3. Оставить OIDC Trusted Publishing. В 2026 году npm требует для него npm
   `>=11.5.1`, Node `>=22.14.0` и cloud-hosted runner; текущий CD с Node
   `24.19.0` и npm `11.19.0` это выполняет
   ([npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)).
4. Не создавать отдельные package names для `npx` или global install.

### Проверки

- exact local install из опубликованной версии;
- `node_modules/.bin/plugin-compiler --help`;
- `npm exec -- plugin-compiler validate` в clean consumer;
- `npm audit signatures` для registry signatures и provenance
  ([npm audit signatures](https://docs.npmjs.com/cli/v11/commands/npm-audit/#audit-signatures)).

## 2. Bun package manager и `bunx`

### Решение

Добавить Bun как **consumer path того же npm artifact**, без Bun-specific
publish. Bun умеет добавлять npm packages, global CLI и exact dependencies
([bun add](https://bun.com/docs/pm/cli/add),
[bun install](https://bun.com/docs/pm/cli/install)). `bunx` умеет запускать bin
из конкретного package через `--package`, что важно здесь: package называется
`ptlam-agent-plugin-compiler`, а команда — `plugin-compiler`
([bunx](https://bun.com/docs/pm/bunx)).

### Рекомендуемые команды

Локальная exact dependency:

```bash
bun add --dev --exact \
  @fam-tung-lam/ptlam-agent-plugin-compiler@next
bunx --no-install \
  --package @fam-tung-lam/ptlam-agent-plugin-compiler \
  plugin-compiler validate
```

Одноразовый exact запуск:

```bash
bunx \
  --package '@fam-tung-lam/ptlam-agent-plugin-compiler@0.1.0-alpha.2' \
  plugin-compiler --help
```

Не следует добавлять `--bun`: `bunx` по умолчанию уважает `#!/usr/bin/env node`
и запускает Node, а `--bun` принудительно меняет runtime
([bunx shebang behavior](https://bun.com/docs/pm/bunx#shebangs)). Значит, этот
канал требует установленный Node `>=22.6.0`; Bun здесь заменяет package manager
и launcher, но не runtime.

### Что менять

1. Никакой новой публикации и версии.
2. Добавить Bun commands в README только после smoke test на exact packed npm
   tarball.
3. В Bun consumer test проверить install, `--help`, `validate`, `generate` и
   `check`. Это тест package-manager compatibility; тест `bunx --bun` был бы
   отдельным обещанием Bun-runtime compatibility и сейчас не нужен.
4. Не добавлять install/prepare lifecycle scripts. Bun не выполняет произвольные
   lifecycle scripts зависимостей по умолчанию; текущий готовый `dist` уже
   делает их ненужными
   ([Bun lifecycle scripts](https://bun.com/docs/pm/cli/install#lifecycle-scripts)).

### Риски

- Bun может разрешить dependency tree иначе, чем npm; нужен consumer smoke test.
- Floating `@next` в одноразовой команде не воспроизводим; для CI нужна версия.
- Запуск с `--bun` может попасть на неполную Node API compatibility; Bun прямо
  документирует еще частично или не полностью реализованные Node APIs
  ([Node.js compatibility](https://bun.com/docs/runtime/nodejs-compat)).

## 3. Homebrew tap и Formula

### Решение

После первого stable-релиза создать отдельный repository
`fam-tung-lam/homebrew-tap`. Formula должна брать **точный npm registry
tarball**, а не строить новую копию из GitHub source и не требовать
standalone-бинарник.

Это соответствует текущим Homebrew rules для Node CLI: immutable checksummed
source, declared runtime, application dependencies внутри formula prefix и
functional test
([Language-Specific Formulae](https://docs.brew.sh/Language-Specific-Formulae)).
Homebrew отдельно рекомендует для Node applications exact npm tarball, SHA-256,
`depends_on "node"`, `std_npm_args` и symlink из `libexec/bin`
([Node.js section](https://docs.brew.sh/Language-Specific-Formulae#nodejs)).

### Почему не сейчас

`homebrew/core` требует stable release и не принимает software без него
([Acceptable Formulae](https://docs.brew.sh/Acceptable-Formulae#stable-releases)).
Текущий `0.1.0-alpha.2` — prerelease. Собственный tap технически может раздавать
alpha, но добавит release surface до стабилизации CLI и версии без явной пользы.

### Целевая форма Formula

Это иллюстрация контракта, а не готовый copy-paste:

```ruby
class PtlamAgentPluginCompiler < Formula
  desc "Compile PTLam-compatible agent plugin projects"
  homepage "https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler"
  url "https://registry.npmjs.org/@fam-tung-lam/ptlam-agent-plugin-compiler/-/ptlam-agent-plugin-compiler-VERSION.tgz"
  sha256 "SHA256_OF_THE_EXACT_NPM_TARBALL"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec/"bin/plugin-compiler"
  end

  test do
    assert_match "validate", shell_output("#{bin}/plugin-compiler --help")
  end
end
```

`std_npm_args` устанавливает package в `libexec`, использует Homebrew npm cache,
учитывает release cooldown и по умолчанию игнорирует lifecycle scripts
([Homebrew Node.js guidance](https://docs.brew.sh/Language-Specific-Formulae#standard-npm-installation)).
Это подходит текущему package, потому что `dist` уже опубликован.

### Release flow

1. npm publication и существующая npm verification полностью завершаются.
2. Tap automation берет versioned `dist.tarball` из npm registry и вычисляет
   SHA-256 именно скачанного `.tgz`.
3. Одним изменением обновляет `url`, `sha256` и version-derived test
   expectation.
4. Запускает `brew audit --strict --online`, install и `brew test` на
   поддерживаемых macOS/Linux runners.
5. Создает reviewable PR в tap; merge происходит только после green checks.

Formula не должна выполнять `npm install -g`, читать floating `latest`,
скачивать код во время runtime или иметь собственную версию. Homebrew требует
immutable source и SHA-256, а dependency resolution не должен быть плавающим
([Acceptable Formulae](https://docs.brew.sh/Acceptable-Formulae#versioned-and-verifiable-sources)).

### Команда пользователя

Для third-party tap документация 2026 года предупреждает, что его код
выполняется с правами пользователя, и рекомендует доверять fully-qualified
Formula, а не всему tap ([Homebrew Taps](https://docs.brew.sh/Taps)). Поэтому
целевая команда:

```bash
brew install fam-tung-lam/tap/ptlam-agent-plugin-compiler
```

## 4. `curl`-based shell installer

### Решение

Сейчас не добавлять. Installer, который внутри вызывает `npm install -g`,
скрывает реальное требование Node/npm, усложняет uninstall/upgrade и не дает
аудитории нового артефакта. Настоящий `curl`-канал оправдан только для Node-free
standalone CLI.

### Предварительный технический gate

Сначала нужен отдельный prototype/spike для standalone build:

- доказать byte-for-byte CLI behavior для `validate`, `generate`, `check` и
  ошибок;
- проверить все runtime assets и dynamic imports;
- собрать и протестировать каждую поддерживаемую OS/architecture на ее runner;
- определить signing/notarization для macOS и Windows;
- зафиксировать runtime и bundler versions;
- доказать reproducibility или как минимум artifact provenance.

Node Single Executable Applications пока имеет статус Stability 1.1 «Active
development». Начиная с Node 25.5 встроенный `--build-sea` поддерживает один
embedded CommonJS- или ESM-script, но зависимости все равно нужно свести в один
доказанный bundle, а cross-platform build имеет ограничения
([Node.js SEA](https://nodejs.org/api/single-executable-applications.html)). Bun
`--compile`, использованный референсом, является другой возможностью, но его
совместимость с этим compiler тоже нельзя считать доказанной по чужому проекту.

### Контракт release assets

Если spike успешен, один release обязан содержать для каждой platform:

1. versioned archive с одним ожидаемым executable;
2. SHA-256 **архива**, а не только файла после распаковки;
3. checksum manifest с парами `hash filename`;
4. build provenance/attestation;
5. install script как versioned, reviewable asset;
6. machine-readable OS/architecture mapping, используемый build и installer
   tests.

GitHub Immutable Releases блокируют изменение tag и assets и автоматически
создают release attestation; assets можно проверять через `gh release verify` и
`gh release verify-asset`
([Immutable Releases](https://docs.github.com/en/enterprise-cloud@latest/code-security/concepts/supply-chain-security/immutable-releases),
[verify release integrity](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/verify-release-integrity)).
Отдельные build attestations можно создавать и проверять через
`gh attestation verify`
([artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)).

### Безопасный installer flow

1. Требовать exact `--version`; alias `latest` может быть только явным
   удобством.
2. Определить OS/architecture по закрытому allowlist и иначе завершиться
   ошибкой.
3. Скачать installer или archive в `mktemp` file, а не направлять сеть прямо в
   shell.
4. Ограничить curl HTTPS-протоколами, redirects, timeout и bounded retry.
5. Fail closed, если archive, checksum, hash tool или manifest entry
   отсутствует.
6. Проверить SHA-256 archive **до** просмотра и распаковки.
7. Проверить entries на absolute paths и `..`, распаковать только во временную
   директорию.
8. Запустить `--version`/`--help`, затем атомарно заменить destination; при
   ошибке сохранить старую версию.
9. Не изменять shell profile без отдельного opt-in.

Подходящий file-first download выглядит так:

```bash
curl --fail --show-error --location \
  --proto '=https' --proto-redir '=https' --tlsv1.2 \
  --retry 3 --retry-max-time 30 --max-time 60 \
  --remove-on-error \
  --output install.sh \
  "https://github.com/fam-tung-lam/ptlam-agent-plugin-compiler/releases/download/vVERSION/install.sh"
less install.sh
sh install.sh --version VERSION
```

curl не считает HTTP 4xx/5xx ошибкой без `--fail`; `--proto` и `--proto-redir`
ограничивают схемы, timeouts предотвращают бесконечное ожидание, а
`--remove-on-error` не оставляет partial file
([curl manual](https://curl.se/docs/manpage.html)). Retry не следует помещать
поверх `curl ... | sh`: повтор может передать shell частичный или дублированный
поток.

Checksum, скачанный с того же скомпрометированного origin, сам по себе
доказывает только совпадение bytes, а не происхождение. Поэтому immutable
release и attestation являются отдельными, не взаимозаменяемыми controls.

## 5. Python, PyPI, `uv tool` и `uvx`

### Решение

Не добавлять для текущего продукта. `uv tool install` и `uvx` работают с
commands, которые предоставляют **Python packages**, и создают изолированные
Python environments
([uv tools concept](https://docs.astral.sh/uv/concepts/tools/),
[uv tools guide](https://docs.astral.sh/uv/guides/tools/)). Python CLI package
объявляет command через `console_scripts`/`[project.scripts]`, указывающий на
Python function
([PyPA entry points](https://packaging.python.org/en/latest/specifications/entry-points/),
[creating CLI tools](https://packaging.python.org/en/latest/guides/creating-command-line-tools/)).

Текущий `plugin-compiler` не является таким package. Тонкий PyPI wrapper,
который скачивает npm package, Node runtime или GitHub binary, добавит:

- второе имя и риск name confusion;
- вторую версию и необходимость синхронизации dist-tags;
- отдельные PyPI credentials/provenance и incident response;
- две стадии сети и два cache/lifecycle контракта;
- неочевидную зависимость Python tool от Node ecosystem.

PyPI/uv имеет смысл только при появлении настоящей Python implementation или
самостоятельного Python API с собственными пользователями, тестами и release
lifecycle. В таком случае это будет новый продуктовый артефакт, а не еще один
alias для Node package.

## Рекомендуемый поэтапный план

### Этап A: сейчас, без нового release surface

1. Сохранить npm каноническим.
2. Уточнить npm one-off команды и prerelease tag semantics.
3. Добавить Bun consumer smoke test на exact npm tarball.
4. После green test документировать `bun add` и `bunx` без `--bun`.

Результат: npm и Bun получают один package, одну версию, одну provenance chain.

### Этап B: после stable `0.1.0`

1. Создать `fam-tung-lam/homebrew-tap`.
2. Добавить Formula из exact npm tarball + SHA-256 + `depends_on "node"`.
3. Автоматизировать PR update только после npm publish и verification.
4. Проверять Formula на macOS и Linux.

Результат: Homebrew становится альтернативным installer/upgrade UX, но не новым
build owner.

### Этап C: только при подтвержденном спросе на Node-free CLI

1. Провести standalone spike с acceptance matrix.
2. Выбрать Node SEA, Bun compile или другой механизм на основании измеренных
   результатов, а не референса.
3. Выпускать versioned archives, checksums и attestations в immutable GitHub
   Release.
4. Только после этого добавить file-first shell installer и, при желании,
   binary-based Homebrew Formula.

### Не делать

- не публиковать PyPI shim;
- не делать shell-wrapper вокруг `npm install -g`;
- не строить npm, Homebrew и curl artifacts независимыми release jobs с
  отдельными версиями;
- не использовать floating build tool versions;
- не пропускать checksum verification;
- не считать Bun package-manager support обещанием Bun-runtime support.

## Acceptance criteria по каналам

| Канал            | Минимальное доказательство                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| npm local        | Exact install в clean project; CLI и root ESM API работают                                                      |
| `npm exec`/`npx` | Exact remote version; правильный единственный bin; аргументы передаются без двусмысленности                     |
| Bun/`bunx`       | Exact npm tarball; Node shebang; `validate`, `generate`, `check`; отсутствие lifecycle dependency               |
| Homebrew         | Exact npm `.tgz` SHA-256; `brew audit`; install/test на macOS и Linux; upgrade с предыдущей stable              |
| `curl`           | Asset-name contract; archive checksum до extraction; attestation; OS/architecture matrix; rollback-safe install |
| PyPI/uv          | Не применимо до отдельного Python product decision                                                              |

## Основные риски

| Риск                       | Последствие                                         | Control                                                              |
| -------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| Floating tag/version       | Разные bytes при одинаковой команде                 | Exact version в CI и release manifests                               |
| Несовпадение имен assets   | Installer всегда падает или выбирает не тот файл    | Один machine-readable mapping + contract test                        |
| Fail-open checksum         | Установка непроверенного executable                 | Отсутствие checksum/hash tool/entry всегда ошибка                    |
| Независимые каналы версий  | Homebrew/curl расходятся с npm                      | npm version и tarball — единственный source of truth                 |
| Bun runtime подменяет Node | Скрытые compatibility failures                      | Node shebang; не использовать `--bun` без отдельного suite           |
| PyPI shim                  | Двойная цепочка поставки и name confusion           | Не публиковать без Python-native продукта                            |
| Native binary matrix       | Signing, assets и behavior расходятся по платформам | Отдельный spike, pinned toolchain, per-platform smoke и attestations |

## Реестр официальных внешних источников

Все источники ниже прочитаны 2026-08-10. Использовались только официальные docs,
specifications и first-party registry/API.

1. npm, `package.json` `bin`:
   <https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#bin>
2. npm, `npm exec` и `npx`: <https://docs.npmjs.com/cli/v11/commands/npm-exec/>
3. npm, install и exact/global behavior:
   <https://docs.npmjs.com/cli/v11/commands/npm-install/>
4. npm Trusted Publishing: <https://docs.npmjs.com/trusted-publishers/>
5. npm provenance: <https://docs.npmjs.com/generating-provenance-statements/>
6. npm audit signatures:
   <https://docs.npmjs.com/cli/v11/commands/npm-audit/#audit-signatures>
7. Bun, `bun add`: <https://bun.com/docs/pm/cli/add>
8. Bun, `bun install` и global packages: <https://bun.com/docs/pm/cli/install>
9. Bun, `bunx` и shebang behavior: <https://bun.com/docs/pm/bunx>
10. Bun, Node.js compatibility: <https://bun.com/docs/runtime/nodejs-compat>
11. Homebrew, language-specific Formulae:
    <https://docs.brew.sh/Language-Specific-Formulae>
12. Homebrew, third-party taps: <https://docs.brew.sh/Taps>
13. Homebrew, acceptable Formulae: <https://docs.brew.sh/Acceptable-Formulae>
14. Homebrew, Formula Cookbook: <https://docs.brew.sh/Formula-Cookbook>
15. curl manual: <https://curl.se/docs/manpage.html>
16. GitHub, Immutable Releases:
    <https://docs.github.com/en/enterprise-cloud@latest/code-security/concepts/supply-chain-security/immutable-releases>
17. GitHub, release integrity verification:
    <https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/verify-release-integrity>
18. GitHub, artifact attestations:
    <https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations>
19. Node.js, Single Executable Applications:
    <https://nodejs.org/api/single-executable-applications.html>
20. uv, tools concept: <https://docs.astral.sh/uv/concepts/tools/>
21. uv, tools guide: <https://docs.astral.sh/uv/guides/tools/>
22. uv installation patterns:
    <https://docs.astral.sh/uv/getting-started/installation/>
23. uv package publishing: <https://docs.astral.sh/uv/guides/package/>
24. PyPA entry points specification:
    <https://packaging.python.org/en/latest/specifications/entry-points/>
25. PyPA, creating and packaging CLI tools:
    <https://packaging.python.org/en/latest/guides/creating-command-line-tools/>
26. npm registry package metadata:
    <https://registry.npmjs.org/@fam-tung-lam%2Fptlam-agent-plugin-compiler>
27. GitHub release metadata:
    <https://api.github.com/repos/fam-tung-lam/ptlam-agent-plugin-compiler/releases/tags/v0.1.0-alpha.2>

## Ограничения исследования

- Никакие новые channels, repositories, packages или release assets не
  создавались.
- Bun/Homebrew/standalone runtime smoke tests не выполнялись; рекомендации для
  них основаны на текущем package contract и официальной документации и явно
  требуют собственных acceptance tests до заявления о поддержке.
- Состояние npm dist-tags и GitHub release assets является временным snapshot на
  2026-08-10 и должно перепроверяться перед реализацией.
