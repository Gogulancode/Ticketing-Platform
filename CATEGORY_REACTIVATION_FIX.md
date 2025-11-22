# Category Reactivation Fix - HTTP 500 Error

## Problem
When trying to create a category or subcategory that already exists but is **inactive** (`IsActive = false`), the system throws a **500 Internal Server Error** due to a unique constraint violation on the category name.

##  Root Cause
The database has a unique constraint on:
- **Category name** (for `TicketCategories`)
- **Category name + CategoryId** (for `TicketSubCategories`)

When a category is deleted (soft-deleted with `IsActive = false`), the name remains in the database. Attempting to create a new category with the same name violates the unique constraint, even though the old one is inactive.

## Solution Implemented
Updated `TicketSettingsService.cs` to **check for inactive entries first** and **reactivate them** instead of creating duplicates:

### For Categories (`CreateCategoryAsync`):
```csharp
// Check if an inactive category with the same name exists
var existingInactive = await _db.TicketCategories
    .FirstOrDefaultAsync(c => c.Name == category.Name && !c.IsActive, ct);

if (existingInactive != null)
{
    // Reactivate it with new properties
    existingInactive.IsActive = true;
    existingInactive.Description = category.Description;
    existingInactive.Color = category.Color;
    existingInactive.IconName = category.IconName;
    existingInactive.UpdatedAt = DateTime.UtcNow;
    // ... save and return
}
```

### For SubCategories (`CreateSubCategoryAsync`):
```csharp
// Check if an inactive subcategory exists for this category
var existingInactive = await _db.TicketSubCategories
    .FirstOrDefaultAsync(sc => sc.Name == subCategory.Name && 
                              sc.CategoryId == subCategory.CategoryId && 
                              !sc.IsActive, ct);

if (existingInactive != null)
{
    // Reactivate it
    existingInactive.IsActive = true;
    existingInactive.Description = subCategory.Description;
    existingInactive.UpdatedAt = DateTime.UtcNow;
    // ... save and return
}
```

## Files Modified
- `backend/ERPTraining.Infrastructure/Services/Ticketing/Settings/TicketSettingsService.cs`

## Deployment Instructions

### Production Server
You need to restart the production API service to apply this fix:

1. **On the production server**, restart the IIS Application Pool or the .NET process
2. **Verify the fix** by trying to create a previously deleted category

### Local Development
The API needs to be stopped and restarted for the changes to take effect.

## Expected Behavior After Fix
- ✅ Creating a category/subcategory with a name that was previously deleted will **reactivate** the old entry
- ✅ No more 500 errors when recreating inactive categories
- ✅ The reactivated entry keeps its original ID and timestamps
- ✅ New properties (description, color, icon) are updated from the create request

## Testing
1. Create a category (e.g., "Transport")
2. Delete it (soft-delete - sets `IsActive = false`)
3. Try to create it again with the same name
4. **Expected**: Category is reactivated successfully with a 201 Created response
5. **Previous behavior**: 500 Internal Server Error with duplicate constraint violation

## Notes
- This preserves historical data by reusing the same database record
- The original ID is maintained, which is good for referential integrity
- The unique constraint remains in place to prevent truly duplicate active entries
- This approach is better than removing the unique constraint, as it maintains data consistency
