import fs from 'fs/promises';
import { MCP_SCAN_PATHS, expandHome } from '../constants.js';
import type { McpTool } from '../types.js';

export async function scanMcp(): Promise<McpTool[]> {
  const tools: McpTool[] = [];
  const seen = new Set<string>();

  const push = (tool: McpTool) => {
    const key = tool.name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tools.push(tool);
  };

  for (const { path: configPath, source } of MCP_SCAN_PATHS) {
    const expanded = expandHome(configPath);
    try {
      const content = await fs.readFile(expanded, 'utf-8');
      const data = JSON.parse(content);

      // Claude Code keeps per-project servers under projects[dir].mcpServers
      if (data.projects && typeof data.projects === 'object') {
        for (const proj of Object.values(data.projects)) {
          const projServers = (proj as Record<string, unknown>)?.mcpServers;
          if (typeof projServers === 'object' && projServers !== null) {
            for (const sname of Object.keys(projServers)) {
              push({ name: sname, source: `${source} (project)`, toolCount: 0, description: '' });
            }
          }
        }
      }

      const servers = Array.isArray(data)
        ? data
        : data.mcpServers ?? data.servers ?? data;

      if (Array.isArray(servers)) {
        for (const s of servers) {
          if (typeof s === 'object' && s !== null) {
            push({
              name: s.name ?? 'unknown',
              source,
              toolCount: Array.isArray(s.tools) ? s.tools.length : 0,
              description: s.description ?? '',
            });
          }
        }
      } else if (typeof servers === 'object' && servers !== null) {
        for (const [sname, sval] of Object.entries(servers)) {
          if (typeof sval === 'object' && sval !== null) {
            const server = sval as Record<string, unknown>;
            // only entries that look like MCP server configs — guards against
            // iterating unrelated top-level keys of ~/.claude.json
            if (!server.command && !server.url && !server.type && !Array.isArray(server.tools)) continue;
            const toolList = Array.isArray(server.tools) ? server.tools : [];
            push({
              name: sname,
              source,
              toolCount: toolList.length,
              description: typeof server.description === 'string' ? server.description : '',
            });
          }
        }
      }
    } catch {
      // file not found or invalid JSON
    }
  }

  // Scan n8n MCP configs
  const n8nPath = expandHome('~/.n8n/mcp.json');
  try {
    const content = await fs.readFile(n8nPath, 'utf-8');
    const data = JSON.parse(content);
    const servers = data.mcpServers ?? data;
    if (typeof servers === 'object' && servers !== null) {
      for (const [sname, sval] of Object.entries(servers)) {
        if (typeof sval === 'object' && sval !== null) {
          push({
            name: sname,
            source: 'n8n',
            toolCount: 0,
            description: '',
          });
        }
      }
    }
  } catch {
    // not found
  }

  return tools;
}
