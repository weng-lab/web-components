# web-components
Shared web components across the Weng/Moore lab suite of genomics research tools

## Prerequisites
Install pnpm - https://pnpm.io/installation
<br/>
This project should be relatively easy to migrate to yarn workspaces if needed, but was built using pnpm workspaces and the following will assume the use of pnpm

## Useful commands

### Storybook
Run Storybook (from root): `pnpm run storybook`

### Build
Build a package (from root): `pnpm --filter ${PACKAGE} build`
- `pnpm --filter psychscreen-legacy-components build`
- `pnpm --filter ui-components build`
- `pnpm --filter visualization build`

Build a package (from package dir): `pnpm build`

### Publish
Publish a package (from root): `pnpm --filter ${PACKAGE} publish --access public`
- `pnpm --filter psychscreen-legacy-components publish --access public`
- `pnpm --filter ui-components publish --access public`
- `pnpm --filter visualization publish --access public`

Publish a package (from package dir): `pnpm publish --access public`

## Repository structure
### Packages
This monorepository holds 3 packages, located in the `/packages` directory:
- psychscreen-legacy-components (npm: @weng-lab/psychscreen-legacy-components)
- ui-components (npm: @weng-lab/ui-components)
- visualization (npm: @weng-lab/visualization)

Each package is versioned, built, and published separately. 

### Storybook
There is one instance of storybook at the root of this repository that pulls in stories from all packages. Storybook is configured via the files in the `./storybook` folder, and stories for the individual components, while able to be written anywhere, should probably live directly next to the component definitions in files. Write stories in `.stories.tsx` files to be included in storybook. See https://storybook.js.org/docs/get-started/whats-a-story

### Vite - https://vite.dev/
The packages are built using Vite. There is one base configuration declared at the root which declared the react plugin and other small config items which shouldn't need to be modified. Within each package there is a Vite config that extends the base config. The `dts` plugin (generates .d.ts files) is defined in each package so that the tsconfig path it points to does not need to be hardcoded at the root, and per-package configuration of tsconfig is self-contained.

Right now this is set to only build ES modules, as all of our apps are modern enough to use `import`.

## Managing Dependencies in this repo
### Tooling Dependencies (like Storybook/Vite): 
Install at the root in `devDependencies`

### Package-Specific Dependencies:
Do you expect the consumer to have a version of it installed separately alongside the package (like React or MUI)? 
- No? Install in the package's `dependencies`
  - Package dependencies --> Used at runtime and makes the dependency available to Vite during the build as well as bundles it with the package.
- Yes? Install in the package's `peerDependencies` AND `devDependencies` AND the root's `devDependencies`
  - Package peerDependencies --> Tells consumer to install the dependency
  - Package devDependencies --> Needed for local dev/build/test of the package
  - Root devDependencies --> Allows storybook access to the dependency when running from the root
  - <b>ALSO: Modify the package's README and add it to the install commands</b>

### Why is `@visx/visx` a `peerDependency` of `/visualization` but all the needed visx packages installed separately at the root in `devDependencies`? 
This is a slightly annoying feature of pnpm in this case, but it is working as designed. `@visx/visx` depends on all of the individual visx packages, but if you want them to actually appear in node_modules for the purpose of linting and building (instead of just being available to @visx/visx via the pnpm store) you need to explicitly list all of them out. Pnpm does this to eliminate the possibility of relying on undeclared transitive dependencies (dependencies of dependencies). `@visx/visx` is used as a `peerDependency` in `/visualization` as our apps currently use yarn or npm which flatten node_modules and do not face this issue. Otherwise there would be 10+ @visx/whatever peer dependencies which is no good.


## Building and Publishing Changes to npm
See "Useful Commands" for build and publish commands depending on working directory.

0. Have an account which has publishing permissions under the @weng-lab npm organization.
1. Increment version in the package's package.json (not the root package.json)
2. Build the library. This will run `rimraf dist` to clear `/dist` before vite builds into it.
3. Publish to npm.