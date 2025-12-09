aws dynamodb create-table `
  --table-name Patients `
  --attribute-definitions `
    AttributeName=patientId,AttributeType=S `
    AttributeName=address,AttributeType=S `
  --key-schema `
    AttributeName=patientId,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --global-secondary-indexes '[{\"IndexName\":\"AddressIndex\",\"KeySchema\":[{\"AttributeName\":\"address\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]' `
  --tags Key=Environment,Value=Development Key=Project,Value=PatientManagement


aws dynamodb describe-table --table-name Patientscls
  

aws cognito-idp initiate-auth `
  --auth-flow USER_PASSWORD_AUTH `
  --client-id bpdkcci623gk8igv53s0ia3n `
  --auth-parameters USERNAME=juzarantri,PASSWORD=Creole@123,SECRET_HASH=2c33a4s07ujp83jpt46pt1i7qn2ja072t76nugcrcjfqsc2kop2 `
  --region ap-south-1