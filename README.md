# Dog Food Monitoring

<p align="center">
<img src="doc/logo.png" alt="drawing" width="200"/>
</p>

## Summary

[- Introduction](#Introduction)\
[- Architecture](#Architecture)\
[- Project structure](#Project-structure)\
[- Getting started](#Getting-started)

## Introduction

This is a project for the exam of Serverless Computing for IoT.

The idea is to **simulate a sensor** placed in a bowl of a dog **to activate a dispenser** that refills the bowl **when the food of the dog is too little**.\
If the dispenser has no more food, the user is notified. When the user is notified, **he can choose what to do** from a Telegram bot, which is one thing among the following:

- Refill the dispenser remotely;
- Warn someone to refill the dispenser.

## Architecture

To simulate the sending of data by an IoT sensor that detects the weight of the food in the dog bowl, you can use the function '**_send-random-food_**' on Nuclio.

The data is an integer value **between 0 and 100** and indicates the **grams of food in the dog bowl**. This value is published in the queue '**iot/sensors/food**' of **RabbitMQ**.

When a value is published in this queue, a function on Nuclio (**_consume-food_**) is triggered, which processes this value. This function checks if the food is too little (**&le;50%**) and, if so, the dispenser refills the bowl. The dispenser is capable of only 3 refills. So when the dispenser is empty after having done 3 refills, it publishes a new message in the queue '**_iot/dispenser_**'. In each case, the food weight is logged by publishing it in the queue '**_iot/logs_**'.

At this point, inside **telegram_bot.js** the publication in **_iot/dispenser_** is intercepted and a message is sent to the user thanks to a **Telegram bot**.

The user chooses what to do but, of course, the action is only simulated.

<p align="center">
<img src="doc/architecture.jpeg" alt="drawing"/>
</p>

## Project structure

- yaml_functions/
  - _**consume-food.yaml**_: takes care of processing received values and to warn the user or log data
  - _**send-random-food.yaml**_: takes care of sending a random value to the queue **iot/sensors/food**
- **.env**: file containing settings for javascript scripts
- _**logger.js**_: takes care of printing both the food weight and the user’s response from the bot
- _**telegram_bot.js**_: takes care of communication from/to bot

## Getting started

> Note: DogFoodMonitoring requires [Node.js](https://nodejs.org/) and [Docker](https://www.docker.com/products/docker-desktop) to run.

From **two different** terminals, start the docker to run RabbitMQ and Nuclio with these following commands:

- **Docker RabbitMQ**:

  ```sh
  docker run -p 9000:15672  -p 1883:1883 -p 5672:5672  cyrilix/rabbitmq-mqtt
  ```

- **Docker Nuclio**:

  ```sh
  docker run -p 8070:8070 -v /var/run/docker.sock:/var/run/docker.sock -v /tmp:/tmp nuclio/dashboard:stable-amd64
  ```

- **Update and deploy Functions**:

  - Type '**localhost:8070**' on your browser to open the homepage of Nuclio;
  - Create new project and call it '_DogFoodMonitoring_';
  - Press '**Create function**', '**Import**' and upload the two functions that are in the **yaml functions** folder;
  - In both, **change the already present IP with your IP**;\
    **!!!Don't forget the trigger!!!**
  - Press **'Deploy'**.

- **Create personal Telegram Bot**:

  - Open Telegram and search for [BotFather](https://t.me/BotFather).
  - Press **start** and type **/newbot**.
  - Give it a **name** and a **unique id** (BotFather will help you).
  - Copy and paste the **Token** that BotFather gave you in the **Telegraf constructor** in [.env](.env) file;

- **Install all dependencies, start Telegram Bot's Server and start Logger**:

  Open again **.env** file and insert your **IP address** instead of '_INSERT_YOUR_IP_'.

  Open **two more** terminals and type, from the **root of the project**, on the first:

  ```sh
  npm install
  node src/telegram_bot.js
  ```

  and on the second:

  ```sh
  node src/logger.js
  ```

- **Start Telegram Bot Client**:

  Now, you can go to the bot you've just created on Telegram and run it.

  The bot will warn you not to stop it to continue receiving updates on the plant.

After all these steps, you are able to send a value using both **send-random-food** on Nuclio and if this value is **less than or equal to 50 after 3 times** you will be notified on the bot and asked to make a decision.
