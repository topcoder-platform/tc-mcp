# Topcoder Model Context Protocol (MCP) Server

## Authentication Based Access via Guards

Tools/Resources/Prompts support authentication via TC JWT and/or M2M JWT. Providing JWT in the requests to the MCP server will result in specific listings and bahavior based on JWT access level/roles/permissions.

#### Using `authGuard` - requires TC jwt presence for access

```ts
  @Tool({
    name: 'query-tc-challenges-private',
    description:
      'Returns a list of Topcoder challenges based on the query parameters.',
    parameters: QUERY_CHALLENGES_TOOL_PARAMETERS,
    outputSchema: QUERY_CHALLENGES_TOOL_OUTPUT_SCHEMA,
    annotations: {
      title: 'Query Public Topcoder Challenges',
      readOnlyHint: true,
    },
    canActivate: authGuard,
  })
```

#### Using `checkHasUserRole(Role.Admin)` - TC Role based guard

```ts
  @Tool({
    name: 'query-tc-challenges-protected',
    description:
      'Returns a list of Topcoder challenges based on the query parameters.',
    parameters: QUERY_CHALLENGES_TOOL_PARAMETERS,
    outputSchema: QUERY_CHALLENGES_TOOL_OUTPUT_SCHEMA,
    annotations: {
      title: 'Query Public Topcoder Challenges',
      readOnlyHint: true,
    },
    canActivate: checkHasUserRole(Role.Admin),
  })
```

#### Using `canActivate: checkM2MScope(M2mScope.QueryPublicChallenges)` - M2M based access via scopes

```ts
  @Tool({
    name: 'query-tc-challenges-m2m',
    description:
      'Returns a list of Topcoder challenges based on the query parameters.',
    parameters: QUERY_CHALLENGES_TOOL_PARAMETERS,
    outputSchema: QUERY_CHALLENGES_TOOL_OUTPUT_SCHEMA,
    annotations: {
      title: 'Query Public Topcoder Challenges',
      readOnlyHint: true,
    },
    canActivate: checkM2MScope(M2mScope.QueryPublicChallenges),
  })
```
