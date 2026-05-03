# Personal Programming Project Report

**Title:** HokieStudy

---

## 1. (5pts) Honor Code and LLM Usage for this Report.

**I have neither given nor received unauthorized assistance on this assignment.**

**I have not used any LLM for this report.**

---

## 2. (15pts) Learning Objectives:

List the learning objectives from your proposal. In your own words explain whether you met those objectives and how (50-100 words each objective). Also describe if you learned something different than expected or anything additional.

**Conceptual Understanding: Learn how to implement basic machine learning algorithms and agents to aid user experience and develop tests**

- I was able to meet this goal and more during the use of my project. I used Claude to help me write tests to test my app out and make sure all the features of the app work properly. I was not able to utilize machine learning agents due to paywalls, but I did use machine learning to help me develop the app

**Skills Development: Build interactive web applications and apps using JavaScript, Python, and HTML and utilize frameworks such as React and Node.js**

- I was able to utilize frameworks such as React and Node.js to build the sign-up and login service into the app, utilizing an authentication system and I was able to use JavaScript, HTML, and Python to build the front and backend with the help of AI to make features such as inputting classes, availability, and matching with students.

---

## 3.

---

## 4. (15pts) Timeline:

Outline how you spent time on your project. Break down the time into specific tasks or milestones. Here is an adjustable schedule to get you started. Actual Details should be 50-100 words each and should compare or reflect on differences from your proposal.

| Time | Task | Expected Details from Proposal | Actual Details |
|------|------|---------------------------------|----------------|
| Hour 1-2 | Research and gather resources | Research and look at other study apps, see what features they include to help their users stay focused. Research methods of effective study methods like the Pomodoro method and implement ways for the user to utilize them within the app. Study languages such as JavaScript and Python and how to utilize them in web development. | I researched the currently Existing navigate360 app VT provides to students. There you have all your classes available and all students who are looking to study. It also has places where you can make appointments with advisors to talk about your courses. I decided to utilize a similar feature where I use courses to help find students but decided to not focus on study techniques. |
| Hour 3-4 | Design the project structure and plan | Make an outline for how the project should be laid out. Outline key features of the app, stating how each feature will help a user with a problem they have. Make a UML diagram for how code should be structured and what code needs to be written first. | With the use of Claude Sonnet, It helped make me a plan for the backend, frontend, and key features of the app which include availability, course input, professor input, and requests to allow students to study together. |
| Hour 5-6 | Start coding the basic functionalities | Begin coding the frontend of the app and website, utilizing VS Code and Android Studio, alongside React and HTML to make the front page that uses a authentication system(login) for the user, and allows for user input for their classes and year. Begin developing the backend of the app using Node.js to handle user data and store it in a database for students to easily return to the place in the app. | With the help of Claude, I took all the data from all the courses and professors from the VT website, making sure students can pick all possible classes and professors possible. I also utilized React to make an authentication by making a sign-up/login |
| Hour 7-8 | Test and debug the initial version | Write tests with the help of LLMs and run them testing core features of the app such as user-input for courses, year and other features such as searching and scheduling within the app. In addition, make sure the app can give notifications and most of all test edge cases. | This part is where I mostly used Claude. I prompted Claude to test out features of the app just like we have developed so far, which is courses and authentication. |
| Hour 9-10 | Refine and add advanced features | Make sure the UI looks very modern and appropriate alongside similar other study apps but also fit for Virginia tech. Make sure the matchmaking system is working correctly on the and allow for users to report feedback for the app so changes can be made in the future to implement any new courses, teachers etc. | I then continued to add more features such as Finding study partners in the system, making an availability calendar, and allowing for putting requests to other students to study with Claude. In addition, I made Claude help me make more tests to make sure app functions work. |
| Additional | | | |

---

## 5. (55pts) Final Product Description:

Include your proposed MVP, Target, and Reach versions.

### i. Minimum Viable Product (MVP):

a. A web-based application where Virginia tech students can input information such as year, courses, professors, and can be matched with students with similar courses and information to study together. MVP contains basic features such as course input and year to give a list of peers who are very similar

### ii. Target Product:

a. A web-based application as well as a mobile app where Virginia Tech students can put information such as Name, year, age, courses, professors, and sections. Students will be able to login, input courses for the first time, and put weekly availability for studying and utilize a calendar that can be exported to other calender apps like google calendar. Utilize react, node.js and a database to perform these duties.

### iii. Reach Version:

a. A web application, with an app on both android and apple that uses AWS services such as Lamba, Bedrock, DynamoDB alongside React and Node.js for user authentication and login and store user information in the DynamoDB database. The app will allow user to store all input, put weekly availability, match with individuals, perform study methods, and the app will allow for alerts to the user.

### iv. (20pts) Description of final product including target audience, user story, problem statement, key features, technical details and technologies used. (100 – 150 words)

- The final product is an app that allows you to connect with students to study with. The app first uses authentication by using a login system, then makes you put all your classes and professors for those classes. Then from there the app allows you to put your availability for the week and what hours you want to study. Then you can study with other students in the system, where you can view how similar you are in availability and classes. This app helps students who feel they need to improve their studying habits, and by studying with other individuals, we often take accountability and have better habits, which is why studying with other students is encouraged. I used Claude Sonnet to help me write tests, parts of the code, and quickly implement all the classes and teachers.

### v. (20pts) Provide a YouTube link to your video demonstration (1–2 minutes, narrated). Important Note: Do not upload your video file directly. Instead, upload your video to YouTube and include the video link clearly here in your report. The level of difficulty and detail of the project should be reasonable for 10 hours of work with LLM support. The project should not be something an LLM can solve without significant effort by the developer.

a. https://youtu.be/ZgIB_2qt9yw

(Be sure to have someone else test that your link is working.)

### vi. (15pts) Any input files, coding files, and test files should be uploaded. Provide a list here of file names and purposes, or any links to live sites or artifacts. Remember code should also be commented. A README file should be created and uploaded so that we have the option to follow your instructions to run your project.

a. App.py – main app code with all the database logic  
b. Seed.py – makes 7 dummy students for the user to test with  
c. Templates- all pages of the app  
d. Styles.css -all the css styling of the app  
e. Courses.json – total vt catalog of courses  
f. Faculty.json – total vt catalog of faculty  
g. Test_app.py – all tests to cover functionality  

**Project Repository & Code Submission Details:**

| GTA Name | Section(s) | Professor |
|----------|------------|-----------|
| Mona Moghadampanah | 13392 & 13394 | S. Cao |
| Katelyn Crumpacker | 13393 & 13395 | M. Ellis |

---

## 6. (10pts) Consultation and Use of LLMs:

Each student must create a unique project but is allowed to consult with other people and use Large Language Models (LLMs). Describe how you incorporated these resources into your project:

### Consultation Description:

I consulted my friends of how they thought about my app vs the existing Navigate360 app. A lot of gripes people had with Navigate360 was due to its bugs and its difficulty to actually find people who want to study on the app due to scheduling being a very difficult part of the app. When I asked people to review my app, they said the courses and instructors is very innovative, but they asked for a feature similar to starrez portal, where you can look at all individuals and how well you guys pair and they also asked for a ability to export the app to the google calendar so it can all be in one space.

### Use of LLMs:

After I identified what features I wanted the app to use; I utilized Claude Sonnet to help make me a plan for the app that was stored in docs. Then utilizing Claude Sonnet, It helped me store all the data of teachers and classes in the data files then utilized React to make an authentication service for students to sign-up and login. Then Claude fully made tests for me to use and run within VS Code to run the features and make sure they work, and it helped with the availability calendar and making the percentage and request feature on the partner part of the website. After I did extensive bug testing and edge case testing, I fixed the changes through help with Claude sonnet.
