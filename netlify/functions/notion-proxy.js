export const handler = async (event) => {
  const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Notion credentials not configured in environment variables." }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { action } = body;

    if (action === "query") {
      const notionRes = await fetch(
        `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!notionRes.ok) {
        const err = await notionRes.json();
        return { statusCode: notionRes.status, headers: CORS_HEADERS, body: JSON.stringify({ error: err }) };
      }

      const data = await notionRes.json();

      // Map Notion pages to goal objects
      const goals = data.results.map((page) => ({
        id: page.id,
        title: page.properties?.Name?.title?.[0]?.plain_text || "Untitled",
        quarter: page.properties?.Quarter?.select?.name || "Q3 2026",
        progress: page.properties?.Progress?.number || 0,
        milestones: [],
      }));

      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ goals }) };
    }

    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "Unknown action" }) };

  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};