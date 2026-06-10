import {context} from '@actions/github';

/**
 * @typedef {Object} AttachZipToRelease
 * @property {'attachZipToRelease'} kind
 * @property {number} releaseId
 */

/**
 * @typedef {Object} CreateDraftRelease
 * @property {'createDraftRelease'} kind
 * @property {string} tagName
 * @property {string} version
 */

/**
 * @returns {AttachZipToRelease|CreateDraftRelease|null}
 */
export default function resolveActionEnvironment() {
  switch (context.eventName) {
    case 'release':
      if (context?.payload?.action === 'published') {
        return {
          kind: 'attachZipToRelease',
          releaseId: context.payload.release.id,
        };
      }
      console.log(
        `The release is not published yet, skipping the upload of the zip file (action: ${JSON.stringify(context.payload?.action ?? null)})`,
      );
      return null;
    case 'push':
      const tagMatch = context?.ref?.match(/^refs\/tags\/(.+)$/);
      const tagName = tagMatch ? tagMatch[1] : null;
      const versionMatch = tagName ? tagName.match(/^(v\.?)?(\d+\.\d+.*)$/i) : null;
      if (versionMatch) {
        return {
          kind: 'createDraftRelease',
          tagName: tagName,
          version: versionMatch[2],
        };
      }
      console.log(
        `Not pushing a version-like tag, skipping the creation of a draft release (ref: ${JSON.stringify(context.ref ?? null)})`,
      );
      return null;
    default:
      console.log(
        `Unsupported event type '${context.eventName}', skipping the upload of the zip file (supported events are 'release' and 'push' of version-like tags)`,
      );
      return null;
  }
}
