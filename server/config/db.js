const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore in environments where setDefaultResultOrder is not available
}

const mongoose = require('mongoose');

// Global connection caching for serverless environments (Vercel / Lambda)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables. Please configure it in your Vercel Project Settings or .env file.');
  }

  // If already connected, reuse existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a connection attempt is in-flight, await the existing promise
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongooseInstance) => {
      console.log(`[DATABASE] MongoDB Connected: ${mongooseInstance.connection.host} (Database: ${mongooseInstance.connection.name})`);
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null; // Reset so next request can retry
      console.error(`[DATABASE ERROR] MongoDB Atlas connection failed: ${err.message}`);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
};

module.exports = connectDB;
