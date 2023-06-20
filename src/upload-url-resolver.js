const github = require('@actions/github');

/**
 * @returns {string}
 */
function resolveUploadUrl() {
    const uploadUrl = github.context?.payload?.release?.upload_url;
    if (uploadUrl) {
        return uploadUrl;
    }
    if (github.context.eventName !== 'release') {
        throw new Error(`This action should be executed in a 'release' event (current event is '${github.context.eventName}')`);
    }
    const eventType = github.context?.payload?.action;
    if (eventType && eventType !== 'published') {
        throw new Error(`Unsupported release type '${eventType}': try to run this action in a publish event of type 'published'`);
    }
    throw new Error('Failed to retrieve the upload URL');
}

exports.resolveUploadUrl = resolveUploadUrl;
