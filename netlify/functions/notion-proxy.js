export const handler = async (event) => {
  const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

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
      body: JSON.stringify({ error: "Notion credentials not configured." }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { action } = body;

    if (action === "query") {
      // Fetch all pages from the database
      const notionRes = await fetch(
        `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ page_size: 100 }),
        }
      );

      if (!notionRes.ok) {
        const err = await notionRes.json();
        return { statusCode: notionRes.status, headers: CORS_HEADERS, body: JSON.stringify({ error: err }) };
      }

      const data = await notionRes.json();
      const pages = data.results;

      // Helper to extract property values
      const getProp = (page, key) => {
        const prop = page.properties?.[key];
        if (!prop) return null;
        switch (prop.type) {
          case "title": return prop.title?.[0]?.plain_text || null;
          case "rich_text": return prop.rich_text?.[0]?.plain_text || null;
          case "select": return prop.select?.name || null;
          case "number": return prop.number ?? null;
          default: return null;
        }
      };

      // Separate into Goals, Milestones, Tasks by Type
      const goals = [];
      const milestones = [];
      const tasks = [];

      pages.forEach(page => {
        const type = getProp(page, "Type");
        const item = {
          id: page.id,
          title: getProp(page, "Name") || "Untitled",
          quarter: getProp(page, "Quarter") || "Q3 2026",
          month: getProp(page, "Month") || "",
          status: getProp(page, "Status") || "Todo",
          priority: getProp(page, "Priority") || "Medium",
          progress: getProp(page, "Progress") || 0,
          parentGoal: getProp(page, "Parent Goal") || "",
          estimatedTime: getProp(page, "Estimated Time") || "",
          notes: getProp(page, "Notes") || "",
          type,
        };

        if (type === "Goal") goals.push(item);
        else if (type === "Milestone") milestones.push(item);
        else if (type === "Task") tasks.push(item);
      });

      // Build nested structure: Goal → Milestones → Tasks
      const structured = goals.map(goal => ({
        id: goal.id,
        title: goal.title,
        quarter: goal.quarter,
        progress: goal.progress,
        status: goal.status,
        priority: goal.priority,
        milestones: milestones
          .filter(ms => ms.parentGoal === goal.title)
          .map(ms => ({
            id: ms.id,
            title: ms.title,
            month: ms.month,
            status: ms.status,
            priority: ms.priority,
            tasks: tasks
              .filter(t => t.parentGoal === ms.title)
              .map(t => ({
                id: t.id,
                title: t.title,
                day: t.month || "This Week",
                est: t.estimatedTime || "",
                status: t.status,
                priority: t.priority,
              })),
          })),
      }));

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ goals: structured }),
      };
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
