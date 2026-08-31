import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(includeInactive = false): Promise<CategoryDocument[]> {
    const query = includeInactive ? {} : { isActive: true };
    return this.categoryModel.find(query).sort({ sortOrder: 1, name: 1 });
  }

  async findBySlug(slug: string): Promise<CategoryDocument> {
    const cat = await this.categoryModel.findOne({ slug, isActive: true });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async findById(id: string): Promise<CategoryDocument> {
    const cat = await this.categoryModel.findById(id);
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    const slug = generateSlug(dto.name);
    const existing = await this.categoryModel.findOne({ slug });
    if (existing) throw new ConflictException('Category with this name already exists');

    return this.categoryModel.create({ ...dto, slug });
  }

  async update(id: string, dto: Partial<CreateCategoryDto>): Promise<CategoryDocument> {
    const cat = await this.categoryModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true, runValidators: true },
    );
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoryModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Category not found');
  }
}
