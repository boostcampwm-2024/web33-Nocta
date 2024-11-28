import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
  @ApiProperty({
    description: "The unique identifier of the user",
    example: "5f8f8c44b54764421b7156c9",
  })
  id: string;

  @ApiProperty({
    description: "The email of the user",
    example: "example@email.com",
  })
  email: string;

  @ApiProperty({
    description: "The name of the user",
    example: "John Doe",
  })
  name: string;

  @ApiProperty({
    description: "The access token for authentication",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  accessToken?: string;
}
