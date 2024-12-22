const jwt = require("jsonwebtoken")
const userModel = require("../models/user");


exports.signup = async (req, res) => {
    const { email, password, first_name, last_name } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).render('blogger', {
                message: 'Email is already in use.',
                user: null,
            });
        }

        // Create the user

        const newUser = await userModel.create({
            first_name,
            last_name,
            email,
            password,
        });

        console.log('User created successfully');

        // Render success message with the user info
        res.render('blogger', {
            message: 'Signup successful',
            user: newUser,
        });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).render('error', {
            message: 'An error occurred during signup. Please try again later.',
            error: error.message,
        });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Missing credentials' });
    }
    
    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

      const isValid = await user.isValidPassword(password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token,
            { 
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', 
                sameSite: 'strict', 
                maxAge: 3600000  
            });

        res.redirect('/blogs/blogger')
    } catch (err) {
        res.status(500).json({ message: 'Error during login', error: err.message });
    }
}

