// Script untuk clear semua data dari database
// Run dengan: node scripts/clear_database.js

const { createClient } = require("@supabase/supabase-js");

// Direct environment variables
const supabaseUrl = "https://qabfrhpbfvjcgdrxdlba.supabase.co";
const supabaseServiceRoleKey = "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Missing Supabase environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function clearDatabase() {
  try {
    console.log("🧹 Starting database cleanup...\n");

    // Delete in order due to foreign key constraints
    console.log("🗑️  Deleting comments...");
    const { error: commentsError } = await supabase
      .from("comments")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

    if (commentsError) {
      console.error("Error deleting comments:", commentsError);
    } else {
      console.log("✅ Comments deleted successfully");
    }

    console.log("🗑️  Deleting likes...");
    const { error: likesError } = await supabase
      .from("likes")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

    if (likesError) {
      console.error("Error deleting likes:", likesError);
    } else {
      console.log("✅ Likes deleted successfully");
    }

    console.log("🗑️  Deleting views...");
    const { error: viewsError } = await supabase
      .from("views")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

    if (viewsError) {
      console.error("Error deleting views:", viewsError);
    } else {
      console.log("✅ Views deleted successfully");
    }

    console.log("🗑️  Deleting projects...");
    const { error: projectsError } = await supabase
      .from("projects")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

    if (projectsError) {
      console.error("Error deleting projects:", projectsError);
    } else {
      console.log("✅ Projects deleted successfully");
    }

    // Keep users table intact - don't delete user profiles
    console.log("👤 Keeping user profiles intact...");

    console.log("\n🎉 Database cleanup completed successfully!");
    console.log("📝 All projects, comments, likes, and views have been removed");
    console.log("👤 User profiles are preserved");
    console.log("\nReady for fresh data! 🚀");
  } catch (error) {
    console.error("❌ Error during database cleanup:", error);
    process.exit(1);
  }
}

// Run the cleanup
clearDatabase();
