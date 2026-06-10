import {context} from '@actions/github';

/**
 * @returns {string}
 */
export default function resolveUploadUrl() {
  const uploadUrl = context?.payload?.release?.upload_url;
  if (uploadUrl) {
    return uploadUrl;
  }
  if (context.eventName !== 'release') {
    throw new Error(`This action should be executed in a 'release' event (current event is '${context.eventName}')`);
  }
  const eventType = context?.payload?.action;
  if (eventType && eventType !== 'published') {
    throw new Error(
      `Unsupported release type '${eventType}': try to run this action in a publish event of type 'published'`,
    );
  }
  throw new Error('Failed to retrieve the upload URL');
}
