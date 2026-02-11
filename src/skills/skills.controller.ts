import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkillsService } from './skills.service';
import { SetMySkillsDto } from './dto/set-my-skills.dto';

@Controller()
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get('skills')
  async listSkills() {
    return this.skillsService.listActiveSkills();
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me/skills')
  async getMySkills(@Req() req: any) {
    const user = req.user;
    if (!user) throw new ForbiddenException('Authentication required');
    if (user.role !== 'worker') throw new ForbiddenException('Only workers have skills');

    const skillIds = await this.skillsService.getUserSkillIds(user.id);
    return { skillIds };
  }

  @UseGuards(JwtAuthGuard)
  @Put('users/me/skills')
  async setMySkills(@Req() req: any, @Body() body: SetMySkillsDto) {
    const user = req.user;
    if (!user) throw new ForbiddenException('Authentication required');
    if (user.role !== 'worker') throw new ForbiddenException('Only workers can set skills');

    const skillIds = await this.skillsService.replaceUserSkills(user.id, body.skillIds);
    return { skillIds };
  }
}
