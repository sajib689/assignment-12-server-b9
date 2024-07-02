# ScholarHub Server

This is the server-side application for the ScholarHub website, which facilitates the backend operations for the scholarship booking platform.

## Features

- User Authentication and Authorization
- Manage Scholarship Listings
- Search and Filter Scholarships
- User Reviews and Ratings
- Notifications for New Scholarships

## Technologies Used

- Node.js
- Express.js
- MongoDB
- JWT for Authentication
- Mongoose for MongoDB Object Modeling

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/scholarhub-server.git
    cd scholarhub-server
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set up environment variables:
    Create a `.env` file in the root directory and add the following:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_uri
    JWT_SECRET=your_jwt_secret
    ```

4. Start the server:
    ```sh
    npm start
    ```

## API Endpoints

### Auth

- **POST /api/auth/register**: Register a new user
- **POST /api/auth/login**: Login a user

### Scholarship Listings

- **GET /api/scholarships**: Get all scholarship listings
- **POST /api/scholarships**: Create a new scholarship listing
- **GET /api/scholarships/:id**: Get a single scholarship listing by ID
- **PUT /api/scholarships/:id**: Update a scholarship listing by ID
- **DELETE /api/scholarships/:id**: Delete a scholarship listing by ID

### Reviews

- **POST /api/reviews**: Create a new review
- **GET /api/reviews/scholarship/:scholarshipId**: Get reviews for a specific scholarship listing

## Contribution

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

## License

This project is licensed under the MIT License.
