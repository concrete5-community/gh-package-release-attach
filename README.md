# GitHub Action to create ZIP archives for concrete5/ConcreteCMS packages

You can use this GitHub Action to automatically attach a ZIP archive of your Concrete package to GitHub Releases.

## Requirements

1. `GITHUB_TOKEN` must be granted write access: go to the repository settings > `Actions` > `General`, and select `Read and write permissions` under `Workflow permissions`.
2. The Concrete package is published in the root directory of the repository (for example, that means that your main `controller.php` file is in the root directory of the repository).

## Sample Usage

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
    steps:
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '7.3'
          tools: composer:v2
          coverage: none
      - name: Checkout
        uses: actions/checkout@v3
      - name: Create and attach ZIP
        uses: concrete5-community/gh-package-release-attach@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
            remove-files: |
                composer.json
                composer.lock
            keep-files: |
                README.md
```

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

# Export-ignore a file named "README.xmlmd" in the root directory
/README.md export-ignore
```

Please remark that the `.gitattributes` files is also respected when installing your package with Composer, so it's a very handy approach for having safer production environments.

## Configuring your Composer dependencies

If your package needs some Composer dependencies, or if your package can also be installed with Composer, you should have a `composer.json` file in the root directory of your repository.

For example:

```json
{
    "name" : "your-name/your_package_handle",
    "type" : "concrete5-package",
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
