'use strict'

// Create a DocumentClient that represents the query to add an nft
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

/**
 * HTTP get method to get all nfts from a DynamoDB table.
 *
 * @param {Object} event - Input event to the Lambda Function.
 * @param {Object} [context]
 * @returns {Object} object - API Gateway Lambda Proxy Output Format.
 */
exports.getAllNftsHandler = async (event) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(
      `getAllNfts only accept GET method, you tried: ${event.httpMethod}`
    );
  }
  // All log statements are written to CloudWatch
  console.info('input event:', event);

  // get all nfts from the table (only first 1MB data, you can use `LastEvaluatedKey` to get the rest of data)
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property
  // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
  var params = {
    TableName: tableName,
  };
  const data = await docClient.scan(params).promise();
  const nfts = data.Items;

  const response = {
    statusCode: 200,
    body: JSON.stringify(nfts),
  };

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};
