const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Base URL for internal API calls using Axios
const BASE_URL = 'http://localhost:5000';

// ==================== HELPER FUNCTIONS ====================

/**
 * Centralized error handler for Axios requests
 * Improves code modularity by avoiding repetitive error handling logic
 * @param {Error} error - The error object from Axios
 * @param {Response} res - Express response object
 * @param {string} customMessage - Custom error message for context
 */
const handleAxiosError = (error, res, customMessage) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return res.status(error.response.status).json({
      message: customMessage,
      error: error.response.data.message || error.message
    });
  } else if (error.request) {
    // The request was made but no response was received
    return res.status(503).json({
      message: "Service unavailable",
      error: "No response received from server"
    });
  } else {
    // Something happened in setting up the request that triggered an Error
    return res.status(500).json({
      message: customMessage,
      error: error.message
    });
  }
};

// ==================== USER REGISTRATION ====================

/**
 * Route: POST /register
 * Purpose: Register a new user in the system
 * Request Body: { username: string, password: string }
 * Response: Success message or error
 */
public_users.post("/register", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (isValid(username)) {
    return res.status(409).json({ message: "User already exists" });
  }

  users.push({ username, password });

  return res.status(201).json({ message: "User registered successfully" });
});

// ==================== SYNCHRONOUS ROUTES ====================

/**
 * Route: GET /
 * Purpose: Retrieve the complete list of books available in the shop
 * Response: JSON string with all books formatted with indentation
 * Synchronous implementation
 */
public_users.get('/',function (req, res) {
  res.send(JSON.stringify(books,null,4));
});

/**
 * Route: GET /isbn/:isbn
 * Purpose: Get detailed information about a book using its ISBN
 * Parameters: isbn - The International Standard Book Number
 * Response: Book object or 404 if not found
 * Synchronous implementation
 */
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.json(book);
});

/**
 * Route: GET /author/:author
 * Purpose: Search and retrieve all books written by a specific author
 * Parameters: author - The name of the author (case-insensitive)
 * Response: Object containing all matching books with their ISBNs as keys
 * Synchronous implementation
 */
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author.toLowerCase();
  const filteredBooks = Object.keys(books).reduce((matches, isbn) => {
    if (books[isbn].author.toLowerCase() === author) {
      matches[isbn] = books[isbn];
    }

    return matches;
  }, {});

  return res.json(filteredBooks);
});

/**
 * Route: GET /title/:title
 * Purpose: Search and retrieve all books matching a specific title
 * Parameters: title - The title of the book (case-insensitive)
 * Response: Object containing all matching books with their ISBNs as keys
 * Synchronous implementation
 */
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title.toLowerCase();
  const filteredBooks = Object.keys(books).reduce((matches, isbn) => {
    if (books[isbn].title.toLowerCase() === title) {
      matches[isbn] = books[isbn];
    }

    return matches;
  }, {});

  return res.json(filteredBooks);
});

/**
 * Route: GET /review/:isbn
 * Purpose: Retrieve all reviews for a specific book
 * Parameters: isbn - The ISBN of the book
 * Response: Object containing all reviews for the book
 * Synchronous implementation
 */
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.json(book.reviews);
});

// ==================== ASYNCHRONOUS ROUTES WITH AXIOS ====================

/**
 * Route: GET /async
 * Purpose: Retrieve all books using async/await pattern with Axios
 * Implementation: Makes an HTTP request to the synchronous endpoint
 * Benefits: Demonstrates Promise-based asynchronous operations
 * Response: Complete list of books
 * Asynchronous implementation using Promises
 */
public_users.get('/async', async function (req, res) {
  try {
    // Using await to handle the Promise returned by axios.get()
    const response = await axios.get(`${BASE_URL}/`);
    return res.status(200).json(response.data);
  } catch (error) {
    // Centralized error handling for better maintainability
    return handleAxiosError(error, res, "Error fetching books");
  }
});

/**
 * Route: GET /async/isbn/:isbn
 * Purpose: Get book details by ISBN using async/await with Axios
 * Parameters: isbn - The International Standard Book Number
 * Implementation: Demonstrates async HTTP request handling
 * Response: Book details or appropriate error message
 * Asynchronous implementation using Promises
 */
public_users.get('/async/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;
  try {
    // Await the Promise from the Axios GET request
    const response = await axios.get(`${BASE_URL}/isbn/${isbn}`);
    return res.status(200).json(response.data);
  } catch (error) {
    // Using modular error handler for consistency
    return handleAxiosError(error, res, "Error fetching book by ISBN");
  }
});

/**
 * Route: GET /async/author/:author
 * Purpose: Search books by author name using async/await with Axios
 * Parameters: author - Name of the author to search for
 * Implementation: Asynchronous Promise-based operation
 * Response: All books by the specified author
 * Asynchronous implementation using Promises
 */
public_users.get('/async/author/:author', async function (req, res) {
  const author = req.params.author;
  try {
    // Using async/await to handle asynchronous HTTP request
    const response = await axios.get(`${BASE_URL}/author/${author}`);
    return res.status(200).json(response.data);
  } catch (error) {
    // Centralized error handling improves code maintainability
    return handleAxiosError(error, res, "Error fetching books by author");
  }
});

/**
 * Route: GET /async/title/:title
 * Purpose: Search books by title using async/await with Axios
 * Parameters: title - Title of the book to search for
 * Implementation: Demonstrates Promise-based async operations
 * Response: All books matching the specified title
 * Asynchronous implementation using Promises
 */
public_users.get('/async/title/:title', async function (req, res) {
  const title = req.params.title;
  try {
    // Await keyword pauses execution until Promise resolves
    const response = await axios.get(`${BASE_URL}/title/${title}`);
    return res.status(200).json(response.data);
  } catch (error) {
    // Reusable error handler for consistent error responses
    return handleAxiosError(error, res, "Error fetching books by title");
  }
});

module.exports.general = public_users;