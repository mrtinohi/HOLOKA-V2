-- Seed script for HOLOKA Property Management & AI Assistant testing
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;
SET NOCOUNT ON;

BEGIN TRANSACTION;

-- Clean existing seeded records for workspace 1 (idempotent re-run)
DELETE FROM dbo.notifications WHERE workspace_id = 1;
DELETE FROM dbo.work_events WHERE workspace_id = 1;
DELETE FROM dbo.tasks WHERE workspace_id = 1;
DELETE FROM dbo.maintenance_requests WHERE workspace_id = 1;
DELETE FROM dbo.payments WHERE workspace_id = 1;
DELETE FROM dbo.invoices WHERE workspace_id = 1;
DELETE FROM dbo.contracts WHERE workspace_id = 1;
DELETE FROM dbo.tenants WHERE workspace_id = 1;
DELETE FROM dbo.rooms WHERE workspace_id = 1;
DELETE FROM dbo.buildings WHERE workspace_id = 1;
DELETE FROM dbo.properties WHERE workspace_id = 1;
DELETE FROM dbo.memberships WHERE workspace_id = 1 AND user_id > 1;
DELETE FROM dbo.app_users WHERE id > 1;

-- 1. Ensure UTF-8 names for default user & workspace
UPDATE dbo.app_users 
SET full_name = N'Quản Trị Viên HOLOKA' 
WHERE id = 1;

UPDATE dbo.workspaces 
SET name = N'Hệ Thống Bất Động Sản An Nhiên Living' 
WHERE id = 1;

-- 2. Add Manager and Staff users
DECLARE @pwd VARCHAR(255) = '$2a$12$UPHVmMxbPMfGHQlWGfTPceahVzU4XWANISGrJmaes8sOduK9rFhky'; -- Abcd1234@

IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE email = 'manager@holoka.vn')
BEGIN
    INSERT INTO dbo.app_users (full_name, email, password_hash, enabled, platform_admin)
    VALUES (N'Trần Văn Hùng', 'manager@holoka.vn', @pwd, 1, 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE email = 'staff@holoka.vn')
BEGIN
    INSERT INTO dbo.app_users (full_name, email, password_hash, enabled, platform_admin)
    VALUES (N'Lê Thị Mai', 'staff@holoka.vn', @pwd, 1, 0);
END;

DECLARE @manager_id BIGINT = (SELECT id FROM dbo.app_users WHERE email = 'manager@holoka.vn');
DECLARE @staff_id BIGINT = (SELECT id FROM dbo.app_users WHERE email = 'staff@holoka.vn');

IF NOT EXISTS (SELECT 1 FROM dbo.memberships WHERE workspace_id = 1 AND user_id = @manager_id)
BEGIN
    INSERT INTO dbo.memberships (workspace_id, user_id, role_code, enabled)
    VALUES (1, @manager_id, 'MANAGER', 1);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.memberships WHERE workspace_id = 1 AND user_id = @staff_id)
BEGIN
    INSERT INTO dbo.memberships (workspace_id, user_id, role_code, enabled)
    VALUES (1, @staff_id, 'STAFF', 1);
END;

-- 3. Properties (3 distinct properties)
-- Workspace 1, Owner 1
INSERT INTO dbo.properties (workspace_id, owner_user_id, name, code, address, description, property_type, status)
VALUES
(1, 1, N'Tòa Nhà Căn Hộ Dịch Vụ An Nhiên - Thảo Điền', 'PROP_TD01', N'12 Quốc Hương, Thảo Điền, TP. Thủ Đức, TP.HCM', N'Căn hộ dịch vụ cao cấp, đầy đủ nội thất, view sông Sài Gòn, hồ bơi và bảo vệ 24/7', 'SERVICED_APARTMENT', 'ACTIVE'),
(1, 1, N'Khu Nhà Trọ Sinh Viên & Công Chức An Nhiên - Cầu Giấy', 'PROP_CG01', N'45 Ngõ 165 Cầu Giấy, P. Dịch Vọng, Cầu Giấy, Hà Nội', N'Nhà trọ khép kín hiện đại, an ninh vân tay, gần các trường đại học lớn', 'ROOM_RENTAL', 'ACTIVE'),
(1, 1, N'Chung Cư Mini An Nhiên Riverside - Bình Thạnh', 'PROP_BT01', N'88 Ung Văn Khiêm, Phường 25, Bình Thạnh, TP.HCM', N'Chung cư mini studio tiện nghi, gần Landmark 81 và các trường đại học', 'APARTMENT', 'ACTIVE');

DECLARE @prop_td BIGINT = (SELECT id FROM dbo.properties WHERE workspace_id = 1 AND code = 'PROP_TD01');
DECLARE @prop_cg BIGINT = (SELECT id FROM dbo.properties WHERE workspace_id = 1 AND code = 'PROP_CG01');
DECLARE @prop_bt BIGINT = (SELECT id FROM dbo.properties WHERE workspace_id = 1 AND code = 'PROP_BT01');

-- 4. Buildings (4 buildings)
INSERT INTO dbo.buildings (workspace_id, property_id, name, code, description, number_of_floors, status)
VALUES
(1, @prop_td, N'Block A - Thảo Điền Luxury', 'BLD_TDA', N'Tòa tháp A mặt tiền Quốc Hương', 5, 'ACTIVE'),
(1, @prop_td, N'Block B - Thảo Điền Garden', 'BLD_TDB', N'Tòa tháp B sân vườn phía sau', 4, 'ACTIVE'),
(1, @prop_cg, N'Tòa Nhà Cầu Giấy 7 Tầng', 'BLD_CG01', N'Tòa nhà trọ thang máy cao cấp', 7, 'ACTIVE'),
(1, @prop_bt, N'Tòa Nhà Riverside Bình Thạnh', 'BLD_BT01', N'Tòa nhà chung cư mini 6 tầng', 6, 'ACTIVE');

DECLARE @bld_tda BIGINT = (SELECT id FROM dbo.buildings WHERE workspace_id = 1 AND code = 'BLD_TDA');
DECLARE @bld_tdb BIGINT = (SELECT id FROM dbo.buildings WHERE workspace_id = 1 AND code = 'BLD_TDB');
DECLARE @bld_cg BIGINT = (SELECT id FROM dbo.buildings WHERE workspace_id = 1 AND code = 'BLD_CG01');
DECLARE @bld_bt BIGINT = (SELECT id FROM dbo.buildings WHERE workspace_id = 1 AND code = 'BLD_BT01');

-- 5. Rooms (18 rooms with realistic mix of OCCUPIED, AVAILABLE, and MAINTENANCE)
-- Thảo Điền Block A
INSERT INTO dbo.rooms (workspace_id, property_id, building_id, room_code, name, floor, area, monthly_rent, status, description, available_since)
VALUES
(1, @prop_td, @bld_tda, 'TDA-101', N'Phòng 101 - Studio Standard', 1, 30.0, 7500000, 'OCCUPIED', N'Studio tầng 1 đầy đủ tiện nghi', NULL),
(1, @prop_td, @bld_tda, 'TDA-102', N'Phòng 102 - Studio Standard', 1, 30.0, 7500000, 'OCCUPIED', N'Studio tầng 1 ban công thoáng mát', NULL),
(1, @prop_td, @bld_tda, 'TDA-201', N'Phòng 201 - Studio Deluxe', 2, 35.0, 8500000, 'OCCUPIED', N'Studio tầng 2 view hồ bơi', NULL),
(1, @prop_td, @bld_tda, 'TDA-202', N'Phòng 202 - Studio Deluxe', 2, 35.0, 8500000, 'AVAILABLE', N'Studio tầng 2 sạch đẹp vừa bảo dưỡng', '2026-10-05 08:00:00'),
(1, @prop_td, @bld_tda, 'TDA-301', N'Phòng 301 - 1PN Premium', 3, 45.0, 10500000, 'OCCUPIED', N'Căn 1 phòng ngủ cao cấp', NULL),
(1, @prop_td, @bld_tda, 'TDA-302', N'Phòng 302 - 1PN Premium', 3, 45.0, 10500000, 'MAINTENANCE', N'Đang xử lý rò rỉ bồn rửa chén', NULL);

-- Thảo Điền Block B
INSERT INTO dbo.rooms (workspace_id, property_id, building_id, room_code, name, floor, area, monthly_rent, status, description, available_since)
VALUES
(1, @prop_td, @bld_tdb, 'TDB-101', N'Phòng B101 - 1PN Garden View', 1, 40.0, 9500000, 'OCCUPIED', N'View sân vườn yên tĩnh', NULL),
(1, @prop_td, @bld_tdb, 'TDB-201', N'Phòng B201 - 1PN Garden View', 2, 40.0, 9500000, 'AVAILABLE', N'Vừa trống, sẵn sàng đón khách mới', '2026-10-12 10:00:00'),
(1, @prop_td, @bld_tdb, 'TDB-301', N'Phòng B301 - Penthouse Studio', 3, 50.0, 12000000, 'OCCUPIED', N'Căn penthouse tầng thượng', NULL);

-- Cầu Giấy
INSERT INTO dbo.rooms (workspace_id, property_id, building_id, room_code, name, floor, area, monthly_rent, status, description, available_since)
VALUES
(1, @prop_cg, @bld_cg, 'CG-201', N'Phòng 201 - Khép Kín Gác Xếp', 2, 22.0, 4500000, 'OCCUPIED', N'Phòng gác lửng, tủ lạnh, điều hòa', NULL),
(1, @prop_cg, @bld_cg, 'CG-202', N'Phòng 202 - Khép Kín Ban Công', 2, 25.0, 5000000, 'OCCUPIED', N'Ban công phơi đồ riêng biệt', NULL),
(1, @prop_cg, @bld_cg, 'CG-301', N'Phòng 301 - Khép Kín Cửa Sổ', 3, 22.0, 4500000, 'AVAILABLE', N'Phòng tầng 3 yên tĩnh', '2026-10-18 14:00:00'),
(1, @prop_cg, @bld_cg, 'CG-302', N'Phòng 302 - Khép Kín Ban Công', 3, 25.0, 5000000, 'OCCUPIED', N'Nội thất cơ bản, máy giặt chung', NULL),
(1, @prop_cg, @bld_cg, 'CG-401', N'Phòng 401 - Khép Kín Cao Cấp', 4, 28.0, 5500000, 'OCCUPIED', N'Phòng rộng có ban công lớn', NULL);

-- Bình Thạnh Riverside
INSERT INTO dbo.rooms (workspace_id, property_id, building_id, room_code, name, floor, area, monthly_rent, status, description, available_since)
VALUES
(1, @prop_bt, @bld_bt, 'BT-201', N'Phòng 201 - Mini Studio 1', 2, 28.0, 7000000, 'OCCUPIED', N'Studio tiện nghi đầy đủ máy giặt sấy', NULL),
(1, @prop_bt, @bld_bt, 'BT-202', N'Phòng 202 - Mini Studio 2', 2, 28.0, 7000000, 'OCCUPIED', N'Phòng đẹp sạch sẽ có bếp riêng', NULL),
(1, @prop_bt, @bld_bt, 'BT-301', N'Phòng 301 - Studio River View', 3, 32.0, 8000000, 'AVAILABLE', N'View sông mát mẻ quanh năm', '2026-10-20 09:00:00'),
(1, @prop_bt, @bld_bt, 'BT-401', N'Phòng 401 - Studio River View', 4, 32.0, 8000000, 'OCCUPIED', N'Căn studio view đẹp nhất tòa', NULL);

-- 6. Tenants (10 tenants)
INSERT INTO dbo.tenants (workspace_id, full_name, phone, email, identity_number, date_of_birth, address, emergency_contact, status)
VALUES
(1, N'Nguyễn Hoàng Nam', '0909123456', 'nam.nh@gmail.com', '079200001234', '1995-04-12', N'Hải Châu, Đà Nẵng', N'Bố: 0909999888', 'ACTIVE'),
(1, N'Trần Thị Thu Trang', '0918765432', 'trang.ttt@gmail.com', '079300005678', '1998-08-25', N'Quận 3, TP.HCM', N'Mẹ: 0918111222', 'ACTIVE'),
(1, N'Phạm Minh Đức', '0982345678', 'duc.pm@gmail.com', '001200009876', '1992-11-03', N'Đống Đa, Hà Nội', N'Vợ: 0982999000', 'ACTIVE'),
(1, N'Vũ Hải Đăng', '0971234567', 'dang.vh@gmail.com', '001300008765', '1996-02-17', N'Ba Đình, Hà Nội', N'Anh trai: 0971555666', 'ACTIVE'),
(1, N'Lê Mỹ Duyên', '0934567890', 'duyen.lm@gmail.com', '079100004321', '1999-07-09', N'Biên Hòa, Đồng Nai', N'Chị gái: 0934111333', 'ACTIVE'),
(1, N'Đặng Quốc Bảo', '0903456789', 'bao.dq@gmail.com', '079200007890', '1994-09-30', N'Nha Trang, Khánh Hòa', N'Bố: 0903888777', 'ACTIVE'),
(1, N'Hoàng Kim Ngân', '0945678901', 'ngan.hk@gmail.com', '001200003456', '2000-01-15', N'Việt Trì, Phú Thọ', N'Mẹ: 0945222444', 'ACTIVE'),
(1, N'Bùi Đình Trọng', '0912345679', 'trong.bd@gmail.com', '079300002345', '1997-06-22', N'Tân Bình, TP.HCM', N'Bạn thân: 0912000111', 'ACTIVE'),
(1, N'Chu Ngọc Anh', '0967890123', 'anh.cn@gmail.com', '001200006789', '1993-12-05', N'Cầu Giấy, Hà Nội', N'Bố: 0967333555', 'ACTIVE'),
(1, N'Võ Tấn Phát', '0923456781', 'phat.vt@gmail.com', '079100008901', '1991-03-18', N'Cần Thơ', N'Mẹ: 0923777999', 'ACTIVE');

-- Tenant IDs
DECLARE @t1 BIGINT = (SELECT id FROM dbo.tenants WHERE workspace_id = 1 AND phone = '0909123456');
DECLARE @t2 BIGINT = (SELECT id FROM dbo.tenants WHERE workspace_id = 1 AND phone = '0918765432');
DECLARE @t3 BIGINT = (SELECT id FROM dbo.tenants WHERE workspace_id = 1 AND phone = '0982345678');
DECLARE @t4 BIGINT = (SELECT id FROM dbo.tenants WHERE workspace_id = 1 AND phone = '0971234567');
DECLARE @t5 BIGINT = (SELECT id FROM dbo.tenants WHERE workspace_id = 1 AND phone = '0934567890');
DECLARE @t6 BIGINT = (SELECT id FROM dbo.tenants WHERE workspace_id = 1 AND phone = '0903456789');
DECLARE @t7 BIGINT = (SELECT id FROM dbo.tenants WHERE workspace_id = 1 AND phone = '0945678901');
DECLARE @t8 BIGINT = (SELECT id FROM dbo.tenants WHERE workspace_id = 1 AND phone = '0912345679');
DECLARE @t9 BIGINT = (SELECT id FROM dbo.tenants WHERE workspace_id = 1 AND phone = '0967890123');
DECLARE @t10 BIGINT = (SELECT id FROM dbo.tenants WHERE workspace_id = 1 AND phone = '0923456781');

-- Room IDs
DECLARE @r_tda101 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'TDA-101');
DECLARE @r_tda102 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'TDA-102');
DECLARE @r_tda201 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'TDA-201');
DECLARE @r_tda301 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'TDA-301');
DECLARE @r_tdb101 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'TDB-101');
DECLARE @r_tdb301 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'TDB-301');
DECLARE @r_cg201 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'CG-201');
DECLARE @r_cg202 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'CG-202');
DECLARE @r_cg302 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'CG-302');
DECLARE @r_cg401 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'CG-401');
DECLARE @r_bt201 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'BT-201');
DECLARE @r_bt202 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'BT-202');
DECLARE @r_bt401 BIGINT = (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'BT-401');

-- 7. Contracts (Active leases)
-- Note: Today is 2026-10-26.
-- Create 2 contracts expiring in the next 30 days (e.g. 2026-11-12 and 2026-11-20) to trigger AI Alert: "contractsExpiringSoon"!
INSERT INTO dbo.contracts (workspace_id, property_id, tenant_id, room_id, contract_code, start_date, end_date, monthly_rent, deposit, status, terms)
VALUES
-- Sắp hết hạn trong 17 ngày (2026-11-12)
(1, @prop_td, @t1, @r_tda101, 'HD_TD_101', '2025-11-12', '2026-11-12', 7500000, 15000000, 'ACTIVE', N'Hợp đồng thuê 1 năm, đóng tiền ngày 05 hàng tháng'),
-- Sắp hết hạn trong 25 ngày (2026-11-20)
(1, @prop_cg, @t3, @r_cg201, 'HD_CG_201', '2025-11-20', '2026-11-20', 4500000, 4500000, 'ACTIVE', N'Hợp đồng thuê phòng sinh viên, thanh toán đầu tháng'),

-- Các hợp đồng dài hạn còn hạn đến giữa/cuối năm 2027
(1, @prop_td, @t2, @r_tda102, 'HD_TD_102', '2026-03-01', '2027-03-01', 7500000, 15000000, 'ACTIVE', N'Thuê căn hộ studio tầng 1'),
(1, @prop_td, @t4, @r_tda201, 'HD_TD_201', '2026-06-01', '2027-06-01', 8500000, 17000000, 'ACTIVE', N'Thuê căn hộ studio tầng 2 view hồ bơi'),
(1, @prop_td, @t5, @r_tda301, 'HD_TD_301', '2026-01-15', '2027-01-15', 10500000, 21000000, 'ACTIVE', N'Thuê căn hộ 1PN cao cấp'),
(1, @prop_td, @t6, @r_tdb101, 'HD_TDB_101', '2026-05-10', '2027-05-10', 9500000, 19000000, 'ACTIVE', N'Thuê căn hộ 1PN Garden View'),
(1, @prop_td, @t7, @r_tdb301, 'HD_TDB_301', '2026-04-01', '2027-04-01', 12000000, 24000000, 'ACTIVE', N'Thuê penthouse studio'),
(1, @prop_cg, @t8, @r_cg202, 'HD_CG_202', '2026-02-01', '2027-02-01', 5000000, 5000000, 'ACTIVE', N'Thuê phòng Cầu Giấy tầng 2'),
(1, @prop_cg, @t9, @r_cg302, 'HD_CG_302', '2026-07-01', '2027-07-01', 5000000, 5000000, 'ACTIVE', N'Thuê phòng Cầu Giấy tầng 3'),
(1, @prop_cg, @t10, @r_cg401, 'HD_CG_401', '2026-08-01', '2027-08-01', 5500000, 5500000, 'ACTIVE', N'Thuê phòng Cầu Giấy tầng 4'),
(1, @prop_bt, @t1, @r_bt201, 'HD_BT_201', '2026-05-01', '2027-05-01', 7000000, 14000000, 'ACTIVE', N'Thuê căn hộ mini Bình Thạnh 201'),
(1, @prop_bt, @t2, @r_bt202, 'HD_BT_202', '2026-09-01', '2027-09-01', 7000000, 14000000, 'ACTIVE', N'Thuê căn hộ mini Bình Thạnh 202'),
(1, @prop_bt, @t5, @r_bt401, 'HD_BT_401', '2026-01-01', '2027-01-01', 8000000, 16000000, 'ACTIVE', N'Thuê căn hộ studio River View 401');

-- Contract IDs
DECLARE @c_td101 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_TD_101');
DECLARE @c_td102 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_TD_102');
DECLARE @c_td201 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_TD_201');
DECLARE @c_td301 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_TD_301');
DECLARE @c_tdb101 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_TDB_101');
DECLARE @c_tdb301 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_TDB_301');
DECLARE @c_cg201 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_CG_201');
DECLARE @c_cg202 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_CG_202');
DECLARE @c_cg302 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_CG_302');
DECLARE @c_cg401 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_CG_401');
DECLARE @c_bt201 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_BT_201');
DECLARE @c_bt202 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_BT_202');
DECLARE @c_bt401 BIGINT = (SELECT id FROM dbo.contracts WHERE workspace_id = 1 AND contract_code = 'HD_BT_401');

-- 8. Invoices (Billing month: 2026-10-01)
-- Most are PAID (creating monthly revenue for October 2026).
-- A couple are ISSUED or PARTIALLY_PAID (creating outstanding debt to trigger AI financial alert).
INSERT INTO dbo.invoices (workspace_id, property_id, tenant_id, room_id, contract_id, invoice_code, billing_month, due_date, rent_amount, electricity_amount, water_amount, service_amount, other_amount, total_amount, paid_amount, status)
VALUES
-- Paid invoices
(1, @prop_td, @t1, @r_tda101, @c_td101, 'INV_202610_001', '2026-10-01', '2026-10-10', 7500000, 650000, 150000, 200000, 0, 8500000, 8500000, 'PAID'),
(1, @prop_td, @t4, @r_tda201, @c_td201, 'INV_202610_003', '2026-10-01', '2026-10-10', 8500000, 780000, 180000, 200000, 0, 9660000, 9660000, 'PAID'),
(1, @prop_td, @t5, @r_tda301, @c_td301, 'INV_202610_004', '2026-10-01', '2026-10-10', 10500000, 920000, 200000, 300000, 0, 11920000, 11920000, 'PAID'),
(1, @prop_td, @t6, @r_tdb101, @c_tdb101, 'INV_202610_005', '2026-10-01', '2026-10-10', 9500000, 850000, 150000, 250000, 0, 10750000, 10750000, 'PAID'),
(1, @prop_td, @t7, @r_tdb301, @c_tdb301, 'INV_202610_006', '2026-10-01', '2026-10-10', 12000000, 1100000, 250000, 350000, 0, 13700000, 13700000, 'PAID'),
(1, @prop_cg, @t8, @r_cg202, @c_cg202, 'INV_202610_008', '2026-10-01', '2026-10-10', 5000000, 420000, 100000, 150000, 0, 5670000, 5670000, 'PAID'),
(1, @prop_cg, @t10, @r_cg401, @c_cg401, 'INV_202610_010', '2026-10-01', '2026-10-10', 5500000, 480000, 120000, 150000, 0, 6250000, 6250000, 'PAID'),
(1, @prop_bt, @t1, @r_bt201, @c_bt201, 'INV_202610_011', '2026-10-01', '2026-10-10', 7000000, 550000, 120000, 200000, 0, 7870000, 7870000, 'PAID'),
(1, @prop_bt, @t5, @r_bt401, @c_bt401, 'INV_202610_013', '2026-10-01', '2026-10-10', 8000000, 680000, 150000, 200000, 0, 9030000, 9030000, 'PAID'),

-- Unpaid / Partially Paid invoices (Triggers AI Outstanding Debt Warning!)
-- HD_TD_102: Chưa thanh toán (status='ISSUED', due: 2026-10-15 - Quá hạn!) -> 8.520.000 VNĐ
(1, @prop_td, @t2, @r_tda102, @c_td102, 'INV_202610_002', '2026-10-01', '2026-10-15', 7500000, 670000, 150000, 200000, 0, 8520000, 0, 'ISSUED'),

-- HD_CG_201: Đã đóng 1 phần (status='PARTIALLY_PAID', còn nợ 2.650.000 VNĐ)
(1, @prop_cg, @t3, @r_cg201, @c_cg201, 'INV_202610_007', '2026-10-01', '2026-10-15', 4500000, 380000, 100000, 170000, 0, 5150000, 2500000, 'PARTIALLY_PAID'),

-- HD_CG_302: Chưa thanh toán (status='ISSUED', due: 2026-10-28) -> 5.650.000 VNĐ
(1, @prop_cg, @t9, @r_cg302, @c_cg302, 'INV_202610_009', '2026-10-01', '2026-10-28', 5000000, 400000, 100000, 150000, 0, 5650000, 0, 'ISSUED'),

-- HD_BT_202: Chưa thanh toán (status='ISSUED', due: 2026-10-27) -> 7.850.000 VNĐ
(1, @prop_bt, @t2, @r_bt202, @c_bt202, 'INV_202610_012', '2026-10-01', '2026-10-27', 7000000, 520000, 130000, 200000, 0, 7850000, 0, 'ISSUED');

-- 9. Payments for PAID and PARTIALLY_PAID invoices
DECLARE @inv1 BIGINT = (SELECT id FROM dbo.invoices WHERE workspace_id = 1 AND invoice_code = 'INV_202610_001');
DECLARE @inv3 BIGINT = (SELECT id FROM dbo.invoices WHERE workspace_id = 1 AND invoice_code = 'INV_202610_003');
DECLARE @inv4 BIGINT = (SELECT id FROM dbo.invoices WHERE workspace_id = 1 AND invoice_code = 'INV_202610_004');
DECLARE @inv5 BIGINT = (SELECT id FROM dbo.invoices WHERE workspace_id = 1 AND invoice_code = 'INV_202610_005');
DECLARE @inv6 BIGINT = (SELECT id FROM dbo.invoices WHERE workspace_id = 1 AND invoice_code = 'INV_202610_006');
DECLARE @inv7 BIGINT = (SELECT id FROM dbo.invoices WHERE workspace_id = 1 AND invoice_code = 'INV_202610_007');
DECLARE @inv8 BIGINT = (SELECT id FROM dbo.invoices WHERE workspace_id = 1 AND invoice_code = 'INV_202610_008');
DECLARE @inv10 BIGINT = (SELECT id FROM dbo.invoices WHERE workspace_id = 1 AND invoice_code = 'INV_202610_010');
DECLARE @inv11 BIGINT = (SELECT id FROM dbo.invoices WHERE workspace_id = 1 AND invoice_code = 'INV_202610_011');
DECLARE @inv13 BIGINT = (SELECT id FROM dbo.invoices WHERE workspace_id = 1 AND invoice_code = 'INV_202610_013');

INSERT INTO dbo.payments (workspace_id, invoice_id, payment_code, amount, payment_method, payment_date, status, reference, note)
VALUES
(1, @inv1, 'PAY_202610_001', 8500000, 'BANK_TRANSFER', '2026-10-06', 'RECORDED', 'MBB-883921', N'Nguyễn Hoàng Nam chuyển khoản tiền thuê P.101'),
(1, @inv3, 'PAY_202610_003', 9660000, 'BANK_TRANSFER', '2026-10-07', 'RECORDED', 'VCB-291033', N'Vũ Hải Đăng chuyển khoản tiền thuê P.201'),
(1, @inv4, 'PAY_202610_004', 11920000, 'BANK_TRANSFER', '2026-10-08', 'RECORDED', 'TCB-554109', N'Lê Mỹ Duyên chuyển khoản tiền phòng P.301'),
(1, @inv5, 'PAY_202610_005', 10750000, 'BANK_TRANSFER', '2026-10-07', 'RECORDED', 'BIDV-99214', N'Đặng Quốc Bảo thanh toán tiền phòng B101'),
(1, @inv6, 'PAY_202610_006', 13700000, 'BANK_TRANSFER', '2026-10-09', 'RECORDED', 'ACB-772183', N'Hoàng Kim Ngân thanh toán căn Penthouse B301'),
(1, @inv7, 'PAY_202610_007', 2500000, 'CASH', '2026-10-12', 'RECORDED', 'CASH-REC-07', N'Phạm Minh Đức nộp tiền mặt đợt 1 phòng 201'),
(1, @inv8, 'PAY_202610_008', 5670000, 'BANK_TRANSFER', '2026-10-09', 'RECORDED', 'VPB-102938', N'Bùi Đình Trọng chuyển khoản tiền phòng CG-202'),
(1, @inv10, 'PAY_202610_010', 6250000, 'BANK_TRANSFER', '2026-10-08', 'RECORDED', 'VCB-991823', N'Võ Tấn Phát chuyển khoản tiền phòng CG-401'),
(1, @inv11, 'PAY_202610_011', 7870000, 'BANK_TRANSFER', '2026-10-05', 'RECORDED', 'MBB-334190', N'Nguyễn Hoàng Nam thanh toán phòng BT-201'),
(1, @inv13, 'PAY_202610_013', 9030000, 'BANK_TRANSFER', '2026-10-06', 'RECORDED', 'TCB-881290', N'Lê Mỹ Duyên thanh toán phòng BT-401');

-- 10. Maintenance Requests
-- 1 OPEN request (unassigned) -> triggers AI alert: "Sự cố bảo trì cần phân công"!
-- 1 IN_PROGRESS request (assigned to staff)
-- 1 COMPLETED request in October 2026 (adds to monthly expense)
INSERT INTO dbo.maintenance_requests (workspace_id, property_id, building_id, room_id, tenant_id, assigned_user_id, request_code, title, description, priority, status, estimated_cost, actual_cost, reported_at, completed_at)
VALUES
-- OPEN: Khẩn cấp bồn rửa
(1, @prop_td, @bld_tda, (SELECT id FROM dbo.rooms WHERE workspace_id = 1 AND room_code = 'TDA-302'), NULL, NULL, 'MR_2026_001', N'Rò rỉ ống thoát nước bồn rửa chén P.302', N'Nước rò rỉ dưới tủ bếp, cần thay van xả và xi-phông mới', 'HIGH', 'OPEN', 450000, 0, '2026-10-25 15:30:00', NULL),

-- IN_PROGRESS: Sửa điều hòa Cầu Giấy
(1, @prop_cg, @bld_cg, @r_cg201, @t3, @staff_id, 'MR_2026_002', N'Bảo trì máy lạnh phòng CG-201 kém mát', N'Máy lạnh Daikin 9000BTU thổi gió không lạnh, nghi nghẹt lưới lọc hoặc thiếu gas', 'MEDIUM', 'IN_PROGRESS', 650000, 0, '2026-10-24 09:15:00', NULL),

-- COMPLETED: Thay đèn hành lang Thảo Điền Block A
(1, @prop_td, @bld_tda, NULL, NULL, @staff_id, 'MR_2026_003', N'Thay đèn chiếu sáng lối thoát hiểm tầng 2 & 3', N'Đã thay 4 bóng tuýp LED Rạng Đông 18W, hoạt động tốt', 'LOW', 'COMPLETED', 300000, 280000, '2026-10-18 10:00:00', '2026-10-18 14:30:00');

-- 11. Operational Tasks
INSERT INTO dbo.tasks (workspace_id, property_id, room_id, assigned_user_id, title, description, priority, status, due_date, completed_at, deleted)
VALUES
(1, @prop_td, NULL, @staff_id, N'Kiểm tra định kỳ áp suất bình chữa cháy & PCCC Tòa Thảo Điền', N'Kiểm tra 16 bình bột MFZ4 và chuông báo cháy toàn bộ 2 Block A & B', 'HIGH', 'TODO', '2026-10-30', NULL, 0),
(1, @prop_cg, NULL, @manager_id, N'Chốt chỉ số công tơ điện nước đầu tháng 11 tại Cầu Giấy', N'Ghi nhận chỉ số điện nước từng phòng để lập hóa đơn tháng 11', 'MEDIUM', 'TODO', '2026-11-01', NULL, 0),
(1, @prop_bt, NULL, @staff_id, N'Bảo trì định kỳ máy bơm nước tăng áp tầng mái Bình Thạnh', N'Kiểm tra rơ-le áp lực và van 1 chiều của máy bơm', 'LOW', 'IN_PROGRESS', '2026-10-28', NULL, 0);

-- 12. Smart Notifications for AI alerts test
INSERT INTO dbo.notifications (workspace_id, user_id, property_id, [rule], type, source_id, window_key, title, message, category, is_read, active, created_at, updated_at, last_seen)
VALUES
(1, 1, @prop_td, 'CONTRACT_EXPIRING', 'CONTRACT', @c_td101, 'WIN_EXP_TD101', N'Hợp đồng P.101 sắp hết hạn', N'Hợp đồng của khách thuê Nguyễn Hoàng Nam tại Thảo Điền sẽ hết hạn vào ngày 12/11/2026. Hãy liên hệ gia hạn!', 'NEEDS_ATTENTION', 0, 1, '2026-10-26 08:00:00', '2026-10-26 08:00:00', NEWID()),
(1, 1, @prop_td, 'INVOICE_OVERDUE', 'PAYMENT', (SELECT id FROM dbo.invoices WHERE invoice_code = 'INV_202610_002'), 'WIN_INV_TD102', N'Hóa đơn P.102 quá hạn thanh toán', N'Hóa đơn tiền thuê tháng 10 của khách Trần Thị Thu Trang (8.520.000 ₫) đã quá hạn 11 ngày. Đề xuất gửi thông báo nhắc nợ!', 'URGENT', 0, 1, '2026-10-26 09:30:00', '2026-10-26 09:30:00', NEWID()),
(1, 1, @prop_td, 'HIGH_MAINTENANCE', 'MAINTENANCE', (SELECT id FROM dbo.maintenance_requests WHERE request_code = 'MR_2026_001'), 'WIN_MR_001', N'Sự cố rò rỉ nước khẩn cấp tại P.302', N'Đang có sự cố rò rỉ nước mức độ HIGH chưa phân công nhân viên kỹ thuật. Cần điều phối xử lý gấp!', 'URGENT', 0, 1, '2026-10-25 16:00:00', '2026-10-25 16:00:00', NEWID());

COMMIT TRANSACTION;

PRINT 'HOLOKA Seed data inserted successfully!';
