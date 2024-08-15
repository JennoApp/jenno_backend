export class CreateUserDto {
  id?: string;
  username: string;
  email: string;
  name: string;
  lastname: string;
  taxid: string;
  password: string;
  accountType: string;
  walletId?: string;
  currency: string;
}
