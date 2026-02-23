import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../domain/user/user-role.enum';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';

@ApiTags('Bids')
@Controller()
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post('projects/:id/bids')
  @Roles(UserRole.FREELANCER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place a bid on a project (FREELANCER only)' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 201, description: 'Bid created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — FREELANCER role required' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 409, description: 'Project is not in OPEN status' })
  async create(
    @Param('id') projectId: string,
    @Body() dto: CreateBidDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.bidsService.create(projectId, dto, req.user.id);
  }

  @Get('projects/:id/bids')
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ranked bids for a project (CLIENT only)' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiQuery({ name: 'rankBy', required: false, enum: ['price', 'rating', 'composite'] })
  @ApiResponse({ status: 200, description: 'Ranked bid list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — CLIENT role required' })
  async findByProject(
    @Param('id') projectId: string,
    @Query('rankBy') rankBy?: string,
  ) {
    return this.bidsService.findByProject(projectId, rankBy);
  }

  @Patch('bids/:id/accept')
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a bid (CLIENT only)' })
  @ApiParam({ name: 'id', description: 'Bid UUID' })
  @ApiResponse({ status: 200, description: 'Bid accepted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  @ApiResponse({ status: 409, description: 'Bid is not in PENDING status' })
  async accept(
    @Param('id') bidId: string,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.bidsService.accept(bidId, req.user.id);
  }

  @Patch('bids/:id/reject')
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a bid (CLIENT only)' })
  @ApiParam({ name: 'id', description: 'Bid UUID' })
  @ApiResponse({ status: 200, description: 'Bid rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  @ApiResponse({ status: 409, description: 'Bid is not in PENDING status' })
  async reject(
    @Param('id') bidId: string,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.bidsService.reject(bidId, req.user.id);
  }
}
