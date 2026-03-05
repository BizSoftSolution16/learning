# PNL Query Optimization Notes

## Key Performance Improvements

### 1. Common Table Expressions (CTEs)
- Replaced repeated base query with reusable CTEs
- `AccountHierarchy`: Built once, used multiple times
- `TransactionData`: Pre-aggregated transactions
- `BaseCalculation`: Combined hierarchy with transactions

### 2. Eliminated Correlated Subqueries
Original had 15+ correlated subqueries per row:
```sql
(SELECT AAAAA.AccountID FROM dbo.Accounts AS AAAAA INNER JOIN...)
```
Replaced with proper JOINs in the CTE.

### 3. Reduced Redundant Aggregations
- Original: 6 levels of nested GROUP BY
- Optimized: Single aggregation in CTE, reused in UNION queries

### 4. Proper JOIN Syntax
- Changed from comma-separated tables to INNER/LEFT JOIN
- Allows query optimizer to work more efficiently

### 5. Index Recommendations
Add these indexes for better performance:

```sql
-- On Accounts table
CREATE INDEX IX_Accounts_Active ON Accounts(IsActive, IsCancel, LevelNo) 
    INCLUDE (AccountID, ParentID, PNLBSL1ID, PNLBSL2ID, PNLBSL3ID);

-- On VoucherTransD
CREATE INDEX IX_VoucherTransD_Active ON VoucherTransD(ISactive, AccountID, VoucherID)
    INCLUDE (Debit, Credit);

-- On VoucherTransM
CREATE INDEX IX_VoucherTransM_Date ON VoucherTransM(EntryDate, VoucherID)
    INCLUDE (Fyear);
```

## Expected Performance Gain
- Original: Multiple full table scans per row
- Optimized: Single scan with indexed lookups
- Estimated improvement: 10-50x faster depending on data size

## Testing
Run both queries with execution plan:
```sql
SET STATISTICS TIME ON;
SET STATISTICS IO ON;
-- Run query
SET STATISTICS TIME OFF;
SET STATISTICS IO OFF;
```
