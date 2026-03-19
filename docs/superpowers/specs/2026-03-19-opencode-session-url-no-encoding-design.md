# Opencode Session URL Without Encoding (Design)

## Goal
Remove URL encoding when constructing the Opencode session iframe URL so the `projectId` and `sessionId` are embedded verbatim in the path.

## Context
The current URL builder in the web app uses `encodeURIComponent` for both `projectId` and `sessionId`. The requirement is to remove encoding entirely and keep the IDs as-is.

## Scope
- Update `buildOpencodeSessionUrl` to remove `encodeURIComponent` usage.
- Keep existing base normalization and artifact resolution behavior unchanged.
- No new validation, configuration flags, or fallback behavior.

## Behavior
- Input: `base`, `projectId`, `sessionId`.
- Output URL format: `${normalizedBase}/${projectId}/session/${sessionId}`.
- If `projectId` or `sessionId` is missing in artifacts, return an empty string (unchanged).

## Risks & Trade-offs
- If IDs contain reserved URL characters (e.g., `/`, `?`, `#`, spaces), the browser may parse the path unexpectedly and the iframe may fail to load. This is accepted per requirement.

## Testing
- Existing tests that assert encoded output will need to be updated to expect raw IDs.
- No new tests required.
