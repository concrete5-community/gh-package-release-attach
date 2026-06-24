# GitHub Action to create ZIP archives for concrete5/ConcreteCMS packages

You can use this GitHub Action to automatically attach a ZIP archive of your Concrete package to GitHub Releases when you publish them or to prepare a GitHub Release when you push a version-like tag (eg `1.2.3` or `v1.2.3`).

### Requirements

1. The Concrete package is published in the root directory of the repository (for example, that means that your main `controller.php` file is in the root directory of the repository)
2. This GitHub Action have to add attachments to GitHub releases. This can be achieved in two alternative ways:
   - Add these lines to your GitHub Action job:
     ```yaml
     permissions:
       contents: write
     ```
   - Pass the action a `token` input containing a GitHub token or PAT that has write access to the repository

## Automatically attaching ZIP archive to GitHub Releases

You can invoke this Action whenever you publish a GitHub Release (note: doesn't work in case of immutable releases).

### Example

```yaml
name: Attach ZIP to GitHub Release

on:
  release:
    types:
      - published
jobs:
  attach-zip:
    name: Attach ZIP to release
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'
          tools: composer:v2.2
          coverage: none
      - name: Checkout
        uses: actions/checkout@v6
      - name: Create and attach ZIP
        uses: concrete5-community/gh-package-release-attach@main
        with:
          remove-files: |
            composer.json
            composer.lock
          keep-files: |
            README.md
```

## Creating GitHub Releases when pushing version-like tags

If your repository has release immutability enabled, it's not possible to attach files to published releases.

In this case, you can use this Action to prepare a draft release for you whenever you push a version-like tag to the repository (eg `1.2.3` or `v1.2.3`).

### Example

```yaml
name: Prepare GitHub Release

on:
  push:
    tags:
      - '*'
jobs:
  prepare-gh-release:
    name: Prepare GitHub Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'
          tools: composer:v2.2
          coverage: none
      - name: Checkout
        uses: actions/checkout@v6
      - name: Create draft release
        uses: concrete5-community/gh-package-release-attach@main
        with:
          remove-files: |
            composer.json
            composer.lock
          keep-files: |
            README.md
```

If you prefer to create a published (not a draft) release, you can use `publish-release`:

```yaml
- name: Create published release
  uses: concrete5-community/gh-package-release-attach@main
  with:
    publish-release: true
```

## PHP Version

If your package is compatible with concrete5 v8 and later, you should use PHP 5.5 and Composer v1:

```yaml
- name: Setup PHP
  uses: shivammathur/setup-php@v2
  with:
    php-version: '5.5'
    tools: composer:v2.2
    coverage: none
```

If your package is compatible with ConcreteCMS v9 and later, you should use PHP 7.3 and Composer v2:

```yaml
- name: Setup PHP
  uses: shivammathur/setup-php@v2
  with:
    php-version: '7.3'
    tools: composer:v2
    coverage: none
```

Of course, even if your package is compatible with concrete5 8, you can still require that your users have a greater PHP version: if so, set the `Setup PHP` step accordingly.

> **Note**
> It's a good practice to have a `composer.json` file defining the (minimum) PHP version to be used in production, as in the following example:
>
> ```json
> {
>   "config": {
>     "platform": {
>       "php": "7.3"
>     }
>   }
> }
> ```

## Configuring ZIP archive contents with `.gitattributes`

You may have some files/directories in your repository that are only used to build/test your package.
Those assets shouldn't be published in production servers.

In order to do so, you can simply create a `.gitattributes` file in the root of your repository, marking with `export-ignore` those assets.

Here's an example of a `.gitattributes` file:

```gitattributes
# Export-ignore files in the root directory that start with a dot
/.* export-ignore

# Export-ignore a directory named "test" in the root directory
/test export-ignore

# Export-ignore a file named "phpunit.xml" in the root directory
/phpunit.xml export-ignore

# Export-ignore a file named "README.md" in the root directory
/README.md export-ignore
```

Please remark that the `.gitattributes` files is also respected when installing your package with Composer, so it's a very handy approach for having safer production environments.

## Configuring your Composer dependencies

If your package needs some Composer dependencies, or if your package can also be installed with Composer, you should have a `composer.json` file in the root directory of your repository.

For example:

```json
{
  "name": "your-name/your_package_handle",
  "type": "concrete5-package",
  "support": {
    "issues": "https://github.com/concrete5-community/acme/issues",
    "source": "https://github.com/concrete5-community/acme"
  },
  "require": {
    "concrete5/core": "^8.5 || >= 9",
    "vendor/dependency": "^1"
  }
}
```

Having a `concrete5/core` dependency may be useful because:

1. it tells composer which Concrete versions are supported by your package
2. if `vendor/dependency` have some Composer dependencies that are already included in Concrete, your package `vendor` directory won't include those dependencies

If your package can be installed with Composer, you can't add mark `composer.json` with `export-ignore` in your `.gitattributes` file (otherwise Composer won't work).

But `composer.json` can be omitted in the ZIP archives containing your package, so you can configure the `concrete5-community/gh-package-release-attach` action to exclude it (see the `remove-files` section in the above sample GitHub workflow).

## Decrease verbosity

You can decrease the output verbosity by setting the `verbose` parameter to `false`:

```yaml
- uses: concrete5-community/gh-package-release-attach@main
  with:
    verbose: false
```
