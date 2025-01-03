export class CreateUserDto {
  id?: string;
  username: string;
  displayname: string;
  email: string;
  name: string;
  lastname: string;
  taxid: string;
  password: string;
  accountType: string;
  walletId?: string;
  currency: string;
}
