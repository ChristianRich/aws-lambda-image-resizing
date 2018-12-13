# AWS Lambda image resizing using
AWS Lambda function to handle image resizing using [npm sharp](https://www.npmjs.com/package/sharp).  

Accepts an existing S3 resource URL, validates the source image, resizes it and save to another file in S3.

Supports any number of images resized from a single source to output e.g fullsize, medium size and thumbnail.

## Installation

```
npm i
```

## Serverless config
The following env vars are required in `serverless.yaml`:  

```
S3_BUCKET_NAME: my-s3-bucket
MAX_FILE_SIZE_MB: 10
MAX_WIDTH_PIXELS: 10000
MAX_HEIGHT_PIXELS: 10000
ALLOWED_IMAGE_TYPES: jpeg,jpg,png

```
## Build and deploy to AWS Lambda

Setup AWS CLI and add your credentials:  
[https://docs.aws.amazon.com/lambda/latest/dg/setup-awscli.html](https://docs.aws.amazon.com/lambda/latest/dg/setup-awscli.html)  


Then bundle and deploy:
```
serverless webpack
serverless deploy
```

Or using a specific AWS profile  
```
serverless deploy --aws-profile myProfileName
```

## Service end-points
`POST /`  
Sample request:

```json
{  
  "data":{  
    "attributes":{  
      "input":{  
        "key":"example.jpg" // Existing file in the target S3 bucket
      },
      "output":{  
        "key":"my-resized-image", // file extension is appended automatically
        "quality":90
      },
      "operations":[  
          {  
          "maxWidth":1200, // Using automatic aspect calculation in order to maintain aspect ratio
          "tag":"fullsize"
        },
        {  
          "width":5000, // Using fixed width / height configuration
          "height":5000,
          "tag":"thumbnail"
        },
      ]
    }
  }
}
```

Sample response outputting the result of the operation:

```json
{  
  "data":[  
    {  
      "type":"image-processing-operation",
      "attributes":{  
        "url":"https://s3-ap-southeast-2.amazonaws.com/s3-target-bucket/2018/12/some-image-1200x900.jpg",
        "key":"some-image-1200x900.jpg",
        "prefix":"2018/12",
        "region":"ap-southeast-2",
        "baseUrl":"https://s3-ap-southeast-2.amazonaws.com",
        "meta":{  
          "processingTime":"1.52 sec",
          "sizeReduction":"89.85%",
          "tag":"fullsize",
          "input":{  
            "width":4048,
            "height":3036,
            "size":"5.29 MB"
          },
          "output":{  
            "width":1200,
            "height":900,
            "size":"549.64 KB"
          }
        }
      }
    },
     {  
      "type":"image-processing-operation",
      "attributes":{  
        "url":"https://s3-ap-southeast-2.amazonaws.com/s3-target-bucket/2018/12/some-image-5000x5000.jpg",
        "key":"some-image-5000x5000.jpg",
        "prefix":"2018/12",
        "region":"ap-southeast-2",
        "baseUrl":"https://s3-ap-southeast-2.amazonaws.com",
        "meta":{  
          "processingTime":"0.58 sec",
          "sizeReduction":"0.00%",
          "tag":"thumbnail",
          "input":{  
            "width":4048,
            "height":3036,
            "size":"5.29 MB"
          },
          "output":{  
            "width":800,
            "height":600,
            "size":"1.01 MB"
          }
        }
      }
    }
  ]
}
```

`POST /getSignedUrl`  
Returns a pre-signed S3 url valid for 5 minutes

## Build npm Sharp for AWS Lambda runtime environment
AWS Lambda requires a Linux x64 compatible installation of [npm sharp](https://www.npmjs.com/package/sharp) because the library during install uses C++ bindings and [node gyp](https://github.com/nodejs/node-gyp). Since C++ compiling is OS dependant the installation files are not portable which does not suit the workflow of Serverless where dependencies are packages on localhost and then deployed remotely.  

There are other workarounds for this, e.g a CI/CD pipeline using Docker, but for this intent and purpose we are building the deploy package locally using a Docker image pre-deployment.

Details here:  
[https://github.com/ChristianRich/aws-lambda-image-resizing/tree/master/lambda-sharp](https://github.com/ChristianRich/aws-lambda-image-resizing/tree/master/lambda-sharp)
