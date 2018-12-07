# AWS Lambda image resizing
AWS Lambda function to handle image resizing

## Create npm Sharp installtion that will run on AWS Lambda architecture (Linux x64)
Problem: Serverless packages up and deploys npm modules that have been compiled on your localhost. This installation will work for most npm modules, but the ones that are built using node-gyp and C++ compiler will only run on the system they are installed on.  

For npm sharp, that means it will not run on AWS Lambda.
Solution: Using a AWS Lambda compliant Docker image, install npm sharp, zip up the installation and distribute it via Serverless to AWS Lambda (serverless deploy).

Fire up a Docker image running AWS Lambda compliant architecture
```
docker run -it lambci/lambda:build-nodejs8.10 bash
```

SSH into the running image and install Sharp and create a zip file from the installation dir

```
npm i sharp
cd node_modules
zip -r sharp.zip sharp/*
```

Exit the running image.
Get the name of the running Docker container

```
docker ps
```

Copy the zip file from the running image to your localhost where `8efe2d858742` is the image id and `myUserName` is the name of your local profile.

```
docker cp 8efe2d858742:/var/task/node_modules/sharp.zip /Users/myUserName
```

Now you have a Linux installation of npm sharp which is compiled against AWS Lambda runtime specifications.

Docs and relevant links:

https://github.com/lambci/docker-lambda  
https://github.com/adieuadieu/retinal/tree/master/lambda-sharp  
https://github.com/lambci/docker-lambda  
https://www.rookout.com/3_min_hack_for_building_local_native_extensions/  
