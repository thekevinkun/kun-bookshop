// Entry point — imports the configured app and starts the HTTP server
import app from "./app";

// Read the port number from .env, or use 5000 as the default if it's not set
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
