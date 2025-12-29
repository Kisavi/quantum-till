import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';


import { combineLatest, finalize } from 'rxjs';

import { InventoryService } from '../../core/services/inventory.service';
import {
  Category,
  ConsolidatedStock,
  RawMaterialItem,
  RawMaterialItemDisplay,
  StockEntry,
  StockEntryDisplay,
} from '../../core/models/raw-material';
import { TimestampMillisPipe } from '../../core/pipes/timestamp-millis.pipe';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TabsModule,
    ProgressSpinnerModule,
    CardModule,
    ToastModule,
    ConfirmDialogModule,
    TimestampMillisPipe
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './inventory.component.html'
})
export class InventoryComponent implements OnInit {
  // Data
  inventory: ConsolidatedStock[] = [];
  purchaseHistory: StockEntryDisplay[] = [];
  stockEntries: StockEntry[] = [];
  items: RawMaterialItem[] = [];
  categories: Category[] = [];

  // UI state
  isLoading = true;
  visibleDialog = false;
  visibleCategoryModal = false;
  visibleItemModal = false;
  visibleImageModal = false;
  selectedImageUrl = '';

  // Forms
  stockEntryForm!: FormGroup;
  categoryForm!: FormGroup;
  rawMaterialItemForm!: FormGroup;

  // Dropdowns
  categoryOptions: SelectOption[] = [];
  filteredItemOptions: SelectOption[] = [];

  isEditingEntry = false;
  editingEntryId: string | null = null;
  isEditingItem = false;
  editingItemId: string | null = null;
  isCreatingCategory = false;
  activeTab = '0';
  isSavingStock = false;
  isSavingItem = false;
  isLoadingItems = true;


  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,

  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadData();
  }

  // ---------------- FORMS ----------------

  private initForms(): void {
    this.stockEntryForm = this.fb.group({
      categoryId: ['', Validators.required],
      itemId: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(1)]],
      purchasePrice: [null, [Validators.required, Validators.min(0)]],
      supplierName: [''],
      supplierContact: [''],
      notes: [''],
      photoBase64: ['']
    });

    this.categoryForm = this.fb.group({
      name: ['', Validators.required]
    });

    this.rawMaterialItemForm = this.fb.group({
      categoryId: ['', Validators.required],
      name: ['', Validators.required],
      baseUnit: ['', Validators.required],
      lowStockThreshold: [0, [Validators.required, Validators.min(0)]]
    });

    this.stockEntryForm.get('categoryId')?.valueChanges.subscribe(val => {
      if (val === 'new') {
        this.visibleCategoryModal = true;
      } else {
        this.updateFilteredItemOptions();
      }
    });

      this.rawMaterialItemForm.get('categoryId')?.valueChanges.subscribe(val => {
      if (val === 'new') {
        this.visibleCategoryModal = true;
      } else {
        this.updateFilteredItemOptions();
      }
    });

    this.stockEntryForm.get('itemId')?.valueChanges.subscribe(val => {
      if (val === 'new') {
        this.visibleItemModal = true;
      }
    });
  }

  // ---------------- DATA LOADING ----------------

  loadData(): void {
    this.isLoading = true;

    combineLatest([
      this.inventoryService.getConsolidatedStock(),
      this.inventoryService.getStockEntries(),
      this.inventoryService.getCategories(),
      this.inventoryService.getItems()
    ]).pipe(finalize(() => { this.isLoadingItems = false,this.isLoading = false })).subscribe({
      next: ([stock, raw, categories, items]) => {
        this.inventory = stock;
        this.categories = categories;
        this.items = items.map(i => {
          const category = categories.find(c => c.id === i.categoryId);
          return {
            ...i,
            categoryName: category?.name || 'Unknown'
          } as RawMaterialItemDisplay;
        });
        this.purchaseHistory = raw.map(r => {
          const item = this.items.find(i => i.id === r.itemId);
          const category = this.categories.find(c => c.id === item?.categoryId);
          const categoryId = item?.categoryId || '';

          return {
            ...r,
            categoryId,
            itemName: item?.name || 'Unknown',
            categoryName: category?.name || 'Unknown'
          } as StockEntryDisplay;
        });

        this.stockEntries = raw;

        this.categoryOptions = [
          { label: 'Create New Category...', value: 'new' },
          ...categories.map(c => ({ label: c.name, value: c.id }))
        ];

        this.updateFilteredItemOptions();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          detail: 'Failed to load inventory data'
        });
      }
    });
  }

  showDialog(item: StockEntryDisplay): void;
  showDialog(): void;


  showDialog(item?: StockEntryDisplay): void {
    this.stockEntryForm.reset();

    if (item) {
      this.isEditingEntry = true;
      this.editingEntryId = item.id;

      this.stockEntryForm.patchValue({
        categoryId: item.categoryId,
        itemId: item.itemId,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        supplierName: item.supplierName,
        supplierContact: item.supplierContact,
        notes: item.notes ?? '',
        photoBase64: item.photoUrl ?? ''
      });
    }

    this.visibleDialog = true;
  }


  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.stockEntryForm.patchValue({ photoBase64: reader.result });
    };
    reader.readAsDataURL(file);
  }

  // ---------------- DROPDOWNS ----------------

  updateFilteredItemOptions(): void {
    const categoryId = this.stockEntryForm.get('categoryId')?.value;

    if (!categoryId || categoryId === 'new') {
      this.filteredItemOptions = [
        { label: 'Select category first', value: '' }
      ];
      return;
    }

    const filtered = this.items.filter(i => i.categoryId === categoryId);
    this.filteredItemOptions = [
      { label: 'Create New Item...', value: 'new' },
      ...filtered.map(i => ({ label: i.name, value: i.id }))
    ];
  }

  // ---------------- CREATE CATEGORY ----------------

  async addNewCategory(): Promise<void> {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    this.isCreatingCategory = true;

    try {
      await this.inventoryService.addCategory({
        name: this.categoryForm.value.name.trim()
      });

      this.messageService.add({
        severity: 'success',
        detail: 'Category created'
      });

      this.isCreatingCategory = false;
      this.visibleCategoryModal = false;
      this.categoryForm.reset();
      this.loadData();
    } catch {
      this.messageService.add({
        severity: 'error',
        detail: 'Failed to create category'
      });
      this.isCreatingCategory = false;
    }
  }

  // ---------------- CREATE ITEM ----------------

    showItemDialog(item?: RawMaterialItem): void {
    this.rawMaterialItemForm.reset();
    this.isEditingItem = false;
    this.editingItemId = null;

    if (item) {
      this.isEditingItem = true;
      this.editingItemId = item.id;
      this.rawMaterialItemForm.patchValue({
        categoryId: item.categoryId,
        name: item.name,
        baseUnit: item.baseUnit,
        lowStockThreshold: item.lowStockThreshold
      });
    }

    this.visibleItemModal = true;
  }

  saveItem(): void {
      if (this.rawMaterialItemForm.invalid) {
      this.rawMaterialItemForm.markAllAsTouched();
      return;
    }

    const f = this.rawMaterialItemForm.value;
    const payload: Omit<RawMaterialItem, 'id'> = {
      categoryId: f.categoryId,
      name: f.name.trim(),
      baseUnit: f.baseUnit.trim(),
      lowStockThreshold: f.lowStockThreshold
    };
    if (this.isEditingItem) {
      this.updateItem(payload);
    } else {
      this.addNewItem(payload);
    }
  }

  async updateItem(payload: Omit<RawMaterialItem, 'id'>): Promise<void> {
    if (!this.editingItemId) return;

    try {
      await this.inventoryService.updateItem(this.editingItemId, payload);

      this.messageService.add({
        severity: 'success',
        detail: 'Item updated successfully'
      });

      this.visibleItemModal = false;
      this.rawMaterialItemForm.reset();
      this.isEditingItem = false;
      this.editingItemId = null;
      this.loadData();
    } catch {
      this.messageService.add({
        severity: 'error',
        detail: 'Failed to update item'
      });
    }
  }

  async addNewItem(payload: Omit<RawMaterialItem, 'id'>): Promise<void> {
    this.isSavingItem = false;
    try {
      await this.inventoryService.addItem(payload);

      this.messageService.add({
        severity: 'success',
        detail: 'Item created'
      });

      this.visibleItemModal = false;
      this.rawMaterialItemForm.reset();
      this.loadData();
    } catch {
      this.messageService.add({
        severity: 'error',
        detail: 'Failed to create item'
      });
    } finally {
      this.isSavingItem = false;
    }
  }

  confirmDeleteRawMaterialItem(item: RawMaterialItem) {
    this.confirmationService.confirm({
      message: `All stock entries related to ${item.name} will be permanently deleted. Are you sure?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancel',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },

      accept: () => {
        this.deleteItemById(item)
      },
      reject: () => {
        this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected' });
      },
    });
  }

  async deleteItemById(item: RawMaterialItem): Promise<void> {
    try {
      const related = this.stockEntries.filter(
        r => r.itemId === item.id
      );

      // Delete all related stock entries
      for (const entry of related) {
        await this.inventoryService.deleteStockEntry(entry.id);
      }

      // Delete the raw material item itself
      await this.inventoryService.deleteItem(item.id);

      this.messageService.add({
        severity: 'success',
        detail: 'Item and related stock entries deleted successfully'
      });

      this.loadData();
    } catch {
      this.messageService.add({
        severity: 'error',
        detail: 'Failed to delete item'
      });
    }
  } 

  // ---------------- ADD RAW MATERIAL ----------------

  async saveInventory(): Promise<void> {
    if (this.stockEntryForm.invalid) {
      this.stockEntryForm.markAllAsTouched();
      return;
    }

    const f = this.stockEntryForm.value;



    const stockEntry: Omit<StockEntry, 'id'> = {
      itemId: f.itemId,
      quantity: f.quantity,
      purchasePrice: f.purchasePrice,
      supplierName: f.supplierName,
      supplierContact: f.supplierContact,
      purchaseDate: new Date(),
      dateAdded: new Date(),
      ...(f.notes && { notes: f.notes }),
      ...(f.photoBase64 && { photoUrl: f.photoBase64 })
    };
    console.log(stockEntry);
    this.isEditingEntry ? this.updateStockEntry(stockEntry) : this.createNewStockEntry(stockEntry);
  }

  async createNewStockEntry(newStockEntry: Omit<StockEntry, 'id'>): Promise<void> {
    this.isSavingStock = true;
    try {
      await this.inventoryService.addStockEntry(newStockEntry);
      this.visibleDialog = false;
      this.messageService.add({
        severity: 'success',
        detail: 'Stock added successfully'
      });
      this.stockEntryForm.reset();
      this.selectedImageUrl = '';
      this.loadData();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        detail: 'Failed to add stock'
      });
    } finally {
      this.isSavingStock = false;
    }
  }

  async updateStockEntry(updatedStockEntry: Omit<StockEntry, 'id'>): Promise<void> {
    if (this.editingEntryId) {
      try {
        await this.inventoryService.updateStockEntry(this.editingEntryId, updatedStockEntry)
        this.visibleDialog = false;
        this.messageService.add({
          severity: 'success',
          detail: 'Stock entry updated successfully'
        });
        this.editingEntryId = null;
        this.isEditingEntry = false;
        this.stockEntryForm.reset();
        this.selectedImageUrl = '';
        this.loadData();
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          detail: 'Failed to update stock entry'
        });
        console.error(error);
      };
    }
  }

  // ---------------- UI HELPERS ----------------

  getStatusClass(status: ConsolidatedStock['status']): string {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800';
      case 'Low Stock':
        return 'bg-orange-100 text-orange-800';
      case 'Out of Stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  viewImage(url?: string): void {
    if (url) {
      this.selectedImageUrl = url;
      this.visibleImageModal = true;
    }
  }


  // ---------------- DELETE ITEM + HISTORY ----------------
  confirmDeleteEntry(entry: StockEntryDisplay) {
    this.confirmationService.confirm({
      message: `Do you want to delete this ${entry.itemName} record?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancel',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },

      accept: () => {
        this.deletePurchaseEntry(entry)
      },
      reject: () => {
        this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected' });
      },
    });
  }

  async deletePurchaseEntry(entry: StockEntryDisplay): Promise<void> {
    try {
      await this.inventoryService.deleteStockEntry(entry.id);
      this.messageService.add({
        severity: 'success',
        detail: 'Purchase entry deleted'
      });
      this.loadData();
    } catch {
      this.messageService.add({
        severity: 'error',
        detail: 'Failed to delete purchase entry'
      });
    }
  }

  confirmDeleteItem(stock: ConsolidatedStock) {
    this.confirmationService.confirm({
      message: `${stock.item.name} and all it's purchase stock entries will be permanently deleted. Are you sure?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancel',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },

      accept: () => {
        this.deleteItem(stock)
      },
      reject: () => {
        this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected' });
      },
    });
  }

  async deleteItem(stock: ConsolidatedStock): Promise<void> {
    try {
      const related = this.stockEntries.filter(
        r => r.itemId === stock.item.id
      );

      // Delete all related stock entries
      for (const r of related) {
        await this.inventoryService.deleteStockEntry(r.id);
      }

      // Delete the item itself
      await this.inventoryService.deleteItem(stock.item.id);

      this.messageService.add({
        severity: 'success',
        detail: 'Item and all stock entries removed'
      });

      this.loadData();
    } catch {
      this.messageService.add({
        severity: 'error',
        detail: 'Failed to delete item'
      });
    }
  }
}
