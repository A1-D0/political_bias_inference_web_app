/*
    * Description: 
    * This file is used to set up the testing environment before running any tests.
    * It loads environment variables from a .env.test file to ensure that the tests 
    * have access to the necessary configurations.
    *
    * Note: the 'npm run test' or 'npm jest' should be run from this file's directory 
    * to ensure that the .env.test file is correctly loaded and all tests of the 
    * sub-directories are run properly.
    *
    * Author: Osvaldo Hernandez-Segura
    * Date Created: February 1, 2026
    * Date Modified: February 7, 2026
    * References: Copilot, ChatGPT, GeeksForGeeks, StackOverflow
*/
import dotenv from 'dotenv';

dotenv.config({
    path: '.env.test',
});
