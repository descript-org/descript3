# descript

  * [Документация](./docs).

## How to publish new release

1. Merge PRs
2. Manually update version
```shell
$ npm version patch
$ git push && git push --tags
```
3. [Create new release from tag](https://github.com/descript-org/descript3/tags) and add changelog.
4. Wait for autodeploy via [githhub action](https://github.com/descript-org/descript3/actions/workflows/npm-publish.yml)
