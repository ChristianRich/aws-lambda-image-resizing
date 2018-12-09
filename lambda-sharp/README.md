# What is this?

The tarballs here are created using the [lambci/docker-lambda](https://github.com/lambci/docker-lambda) images. They represent a containerised nearly-identical equivalent to the environment in which a real Lambda function gets invoked. This lets us build the sharp module locally, but targeting the [Lambda execution environment](http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html).  

The docker image produces the same tarball which contains the libvips library binaries if you were to build the [npm sharp](https://www.npmjs.com/package/sharp) module on a Linux machine. We include it here so that it is possible to deploy the lambda function from any OS. The tarball is used during the Serverless deployment/packaging step to create the zip file for deploying the function to Lambda.

We dereference the symlinks when creating the tarball, which means a copy of many linux .so binaries are included in the tarball. We do this because, without the dereference, the symlinks would not be valid on MacOS or Windows systems causing the Serverless packaging step to fail.

To create the tarball using Docker, install and start [Docker](https://www.docker.com/get-started) then run the following command:
```
npm run build:sharp
```

Above command is just a wrapper for:
```
docker build -t serverless-sharp-image lambda-sharp && docker run -v \"$PWD/lambda-sharp\":/var/task serverless-sharp-image
```

During [Serverless](https://www.npmjs.com/package/serverless) deploy the tarball is being expanded and copied into the deploy package `node_modules` folder.

Thanks to [Marco Lüthy / Adieuadieu](https://github.com/adieuadieu/retinal/tree/master/lambda-sharp) for coming up with this.

https://github.com/adieuadieu/retinal/tree/master/lambda-sharp  
https://github.com/lambci/docker-lambda  
https://github.com/lambci/docker-lambda  
https://www.rookout.com/3_min_hack_for_building_local_native_extensions/  
