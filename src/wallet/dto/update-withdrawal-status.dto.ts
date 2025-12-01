import { IsEnum, IsNotEmpty } from 'class-validator';

export enum WithdrawalStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export class UpdateWithdrawalStatusDto {
  @IsNotEmpty()
  @IsEnum(WithdrawalStatus, {
    message: 'El estado debe ser pending, completed o rejected',
  })
  status: WithdrawalStatus;
}
