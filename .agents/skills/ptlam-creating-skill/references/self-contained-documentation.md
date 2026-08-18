# Self-Contained Skill Documentation

This reference owns which skill instructions must be local and which external
links a package may carry.

## Make the package sufficient

An agent must be able to understand and execute the skill when every external
URL is unavailable. Put every required instruction, constraint, definition,
procedure, and example in `SKILL.md` or another file inside the skill package.
Use relative links to navigate between package files.

Do not tell the agent to open, read, check, or consult an external URL to
understand or complete the workflow. Do not leave required operational knowledge
only on an external page.

External pages are unreliable inputs. The agent may lack network or browser
access. A page may disappear, change, or render incorrectly. Extracted text may
mix navigation and unrelated content into the instructions. These differences
make execution less deterministic and the package harder to review.

When external material contains required knowledge, summarize or adapt that
knowledge into the package. Preserve attribution required by its license.

## Keep external links non-operational

| Link purpose                                   | Allowed | Package requirement                                      |
| ---------------------------------------------- | ------- | -------------------------------------------------------- |
| Required instruction, constraint, or procedure | No      | Put the complete operational knowledge in a local file   |
| Required definition or example                 | No      | Define or demonstrate it locally                         |
| Acknowledgement, attribution, or inspiration   | Yes     | Keep it separate from operational instructions if useful |
| Canonical homepage or documentation identity   | Yes     | The link identifies the tool, library, or service only   |

A permitted link must not carry information the agent needs to make a decision,
perform a step, recover from failure, or judge completion.

Unacceptable required reading:

> Before publishing,
> [read the external recovery guide](https://example.com/recovery) and follow
> its rollback procedure.

Acceptable tool identification:

> Publish with Example CLI
> ([canonical documentation](https://example.com/docs)). Run `example publish`,
> confirm the returned release ID, and run `example rollback <release-id>` if
> verification fails.

Acceptable attribution:

> This locally documented workflow adapts the
> [Example method](https://example.com/method) by Example Org under the Example
> License.

## Audit without opening links

1. Find every external URL in `SKILL.md` and its local references.
2. Classify each URL by the table above.
3. Treat the destination as unavailable and trace every workflow from its local
   entry point through completion and recovery.
4. Move any missing operational knowledge into the package, with required
   attribution.
5. Confirm package navigation uses relative links and keep acknowledgement links
   separate from operational instructions where practical.

The audit passes when deleting every external link would remove only attribution
or identity, not knowledge required to execute or review the skill.
