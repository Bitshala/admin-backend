import { IsNumber, IsOptional, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginatedQueryDto {
    @IsNumber()
    @Type(() => Number)
    @Max(100)
    pageSize = 10;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    page = 0;
}

export class PaginatedDataDto<TData> {
    totalRecords: number;

    records: TData[];

    constructor(obj: PaginatedDataDto<TData>) {
        this.totalRecords = obj.totalRecords;
        this.records = obj.records;
    }
}
