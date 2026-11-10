package com.holoka.config;

import com.holoka.building.Building;
import com.holoka.building.BuildingRepository;
import com.holoka.contract.Contract;
import com.holoka.contract.ContractRepository;
import com.holoka.contract.ContractStatus;
import com.holoka.invoice.Invoice;
import com.holoka.invoice.InvoiceRepository;
import com.holoka.invoice.InvoiceStatus;
import com.holoka.maintenance.MaintenanceRequest;
import com.holoka.maintenance.MaintenanceRepository;
import com.holoka.maintenance.MaintenanceStatus;
import com.holoka.payment.Payment;
import com.holoka.payment.PaymentMethod;
import com.holoka.payment.PaymentRepository;
import com.holoka.property.Property;
import com.holoka.property.PropertyRepository;
import com.holoka.property.PropertyType;
import com.holoka.property.RecordStatus;
import com.holoka.room.Room;
import com.holoka.room.RoomRepository;
import com.holoka.room.RoomStatus;
import com.holoka.task.Task;
import com.holoka.task.TaskRepository;
import com.holoka.task.TaskStatus;
import com.holoka.tenant.Tenant;
import com.holoka.tenant.TenantRepository;
import com.holoka.user.AppUser;
import com.holoka.user.UserRepository;
import com.holoka.work.Priority;
import com.holoka.workspace.Membership;
import com.holoka.workspace.MembershipRepository;
import com.holoka.workspace.Role;
import com.holoka.workspace.Workspace;
import com.holoka.workspace.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DataInitializer — Seeds demo data idempotently on every startup.
 *
 * <p>Strategy: check existence by a stable unique key (email, code, phone …)
 * before inserting — safe to run against an already-seeded database.
 *
 * <p>Activated by default profile; excluded from "test" profile.
 * To disable seeding in production, add spring.profiles.active=prod and
 * exclude "default" profile from this component, or set
 * holoka.seed.enabled=false in application.properties and add a
 * @ConditionalOnProperty guard.</p>
 */
@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    // ── BCrypt hash of "Abcd1234@" (cost 12) ──────────────────────────
    private static final String DEFAULT_HASH =
            "$2a$12$UPHVmMxbPMfGHQlWGfTPceahVzU4XWANISGrJmaes8sOduK9rFhky";

    private final UserRepository        users;
    private final WorkspaceRepository   workspaces;
    private final MembershipRepository  memberships;
    private final PropertyRepository    properties;
    private final BuildingRepository    buildings;
    private final RoomRepository        rooms;
    private final TenantRepository      tenants;
    private final ContractRepository    contracts;
    private final InvoiceRepository     invoices;
    private final PaymentRepository     payments;
    private final MaintenanceRepository maintenance;
    private final TaskRepository        tasks;
    private final PasswordEncoder       encoder;

    // ─────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("[DataInitializer] Starting demo seed …");
        try {
            seedUsers();
            seedWorkspace();
            seedProperties();
            seedBuildings();
            seedRooms();
            seedTenants();
            seedContracts();
            seedInvoices();
            seedPayments();
            seedMaintenance();
            seedTasks();
            log.info("[DataInitializer] Demo seed completed successfully.");
        } catch (Exception ex) {
            log.error("[DataInitializer] Seed failed — {}", ex.getMessage(), ex);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // 1. USERS
    // ══════════════════════════════════════════════════════════════════
    private void seedUsers() {
        ensureUser("Nguyễn Văn An (Chủ căn hộ)", "admin@holoka.vn",       false);
        ensureUser("HOLOKA Super Admin",         "superadmin@holoka.vn",  true);
        ensureUser("HOLOKA Super Admin",         "supperadmin@holoka.vn", true);
        ensureUser("Trần Văn Hùng",              "manager@holoka.vn",     false);
        ensureUser("Lê Thị Mai",                 "staff@holoka.vn",       false);
    }

    private AppUser ensureUser(String name, String email, boolean platformAdmin) {
        return users.findByEmail(email).map(u -> {
            u.updateProfile(name);
            u.changePassword(DEFAULT_HASH);
            return users.save(u);
        }).orElseGet(() -> {
            log.debug("[DataInitializer] Creating user: {}", email);
            return users.save(new AppUser(name, email, DEFAULT_HASH, platformAdmin));
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // 2. WORKSPACE
    // ══════════════════════════════════════════════════════════════════
    private void seedWorkspace() {
        // Expect workspace id=1 from Flyway migration; ensure memberships
        Workspace ws = workspaces.findById(1L).orElseGet(() -> {
            log.debug("[DataInitializer] Creating workspace 'An Nhiên Living'");
            return workspaces.save(new Workspace("Hệ Thống Bất Động Sản An Nhiên Living"));
        });

        ensureMembership(ws, "admin@holoka.vn",   Role.OWNER);
        ensureMembership(ws, "manager@holoka.vn", Role.MANAGER);
        ensureMembership(ws, "staff@holoka.vn",   Role.STAFF);
    }

    private void ensureMembership(Workspace ws, String email, Role role) {
        users.findByEmail(email).ifPresent(user -> {
            boolean exists = memberships.activeInWorkspace(user.getId(), ws.getId()).isPresent();
            if (!exists) {
                log.debug("[DataInitializer] Adding {} membership for {}", role, email);
                memberships.save(new Membership(ws, user, role));
            }
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // 3. PROPERTIES
    // ══════════════════════════════════════════════════════════════════
    private void seedProperties() {
        ensureProperty(1L, "PROP_TD01",
            "Tòa Nhà Căn Hộ Dịch Vụ An Nhiên - Thảo Điền",
            "12 Quốc Hương, Thảo Điền, TP. Thủ Đức, TP.HCM",
            "Căn hộ dịch vụ cao cấp, đầy đủ nội thất, view sông Sài Gòn, hồ bơi và bảo vệ 24/7",
            PropertyType.SERVICED_APARTMENT);

        ensureProperty(1L, "PROP_CG01",
            "Khu Nhà Trọ Sinh Viên & Công Chức An Nhiên - Cầu Giấy",
            "45 Ngõ 165 Cầu Giấy, P. Dịch Vọng, Cầu Giấy, Hà Nội",
            "Nhà trọ khép kín hiện đại, an ninh vân tay, gần các trường đại học lớn",
            PropertyType.ROOM_RENTAL);

        ensureProperty(1L, "PROP_BT01",
            "Chung Cư Mini An Nhiên Riverside - Bình Thạnh",
            "88 Ung Văn Khiêm, Phường 25, Bình Thạnh, TP.HCM",
            "Chung cư mini studio tiện nghi, gần Landmark 81 và các trường đại học",
            PropertyType.APARTMENT);
    }

    private Property ensureProperty(long workspaceId, String code, String name,
                                    String address, String description, PropertyType type) {
        return properties.findByCodeAndWorkspaceId(code, workspaceId).orElseGet(() -> {
            log.debug("[DataInitializer] Creating property: {}", code);
            long ownerId = users.findByEmail("admin@holoka.vn")
                    .map(AppUser::getId).orElse(1L);
            Property p = new Property(workspaceId);
            p.update(name, code, address, description, type, RecordStatus.ACTIVE, ownerId);
            return properties.save(p);
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // 4. BUILDINGS
    // ══════════════════════════════════════════════════════════════════
    private void seedBuildings() {
        long wId = 1L;
        long propTd = propId("PROP_TD01");
        long propCg = propId("PROP_CG01");
        long propBt = propId("PROP_BT01");

        ensureBuilding(wId, propTd, "BLD_TDA", "Block A - Thảo Điền Luxury",
            "Tòa tháp A mặt tiền Quốc Hương", 5);
        ensureBuilding(wId, propTd, "BLD_TDB", "Block B - Thảo Điền Garden",
            "Tòa tháp B sân vườn phía sau", 4);
        ensureBuilding(wId, propCg, "BLD_CG01", "Tòa Nhà Cầu Giấy 7 Tầng",
            "Tòa nhà trọ thang máy cao cấp", 7);
        ensureBuilding(wId, propBt, "BLD_BT01", "Tòa Nhà Riverside Bình Thạnh",
            "Tòa nhà chung cư mini 6 tầng", 6);
    }

    private Building ensureBuilding(long wId, long propId, String code,
                                    String name, String desc, int floors) {
        return buildings.findByCodeAndWorkspaceId(code, wId).orElseGet(() -> {
            log.debug("[DataInitializer] Creating building: {}", code);
            Building b = new Building(wId, propId);
            b.update(name, code, desc, floors, RecordStatus.ACTIVE);
            return buildings.save(b);
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // 5. ROOMS
    // ══════════════════════════════════════════════════════════════════
    private void seedRooms() {
        long wId = 1L;
        long tdProp = propId("PROP_TD01"), tda = bldId("BLD_TDA"), tdb = bldId("BLD_TDB");
        long cgProp = propId("PROP_CG01"), cgB = bldId("BLD_CG01");
        long btProp = propId("PROP_BT01"), btB = bldId("BLD_BT01");

        // Block A
        ensureRoom(wId, tdProp, tda, "TDA-101", "Phòng 101 - Studio Standard",   1, bd("30"), bd("7500000"), RoomStatus.OCCUPIED,   "Studio tầng 1 đầy đủ tiện nghi",        null);
        ensureRoom(wId, tdProp, tda, "TDA-102", "Phòng 102 - Studio Standard",   1, bd("30"), bd("7500000"), RoomStatus.OCCUPIED,   "Studio tầng 1 ban công thoáng mát",     null);
        ensureRoom(wId, tdProp, tda, "TDA-201", "Phòng 201 - Studio Deluxe",     2, bd("35"), bd("8500000"), RoomStatus.OCCUPIED,   "Studio tầng 2 view hồ bơi",             null);
        ensureRoom(wId, tdProp, tda, "TDA-202", "Phòng 202 - Studio Deluxe",     2, bd("35"), bd("8500000"), RoomStatus.AVAILABLE,  "Studio tầng 2 sạch đẹp vừa bảo dưỡng", ldt("2026-10-05T08:00:00"));
        ensureRoom(wId, tdProp, tda, "TDA-301", "Phòng 301 - 1PN Premium",       3, bd("45"), bd("10500000"), RoomStatus.OCCUPIED,  "Căn 1 phòng ngủ cao cấp",               null);
        ensureRoom(wId, tdProp, tda, "TDA-302", "Phòng 302 - 1PN Premium",       3, bd("45"), bd("10500000"), RoomStatus.MAINTENANCE,"Đang xử lý rò rỉ bồn rửa chén",        null);
        // Block B
        ensureRoom(wId, tdProp, tdb, "TDB-101", "Phòng B101 - 1PN Garden View",  1, bd("40"), bd("9500000"), RoomStatus.OCCUPIED,   "View sân vườn yên tĩnh",                null);
        ensureRoom(wId, tdProp, tdb, "TDB-201", "Phòng B201 - 1PN Garden View",  2, bd("40"), bd("9500000"), RoomStatus.AVAILABLE,  "Vừa trống, sẵn sàng đón khách mới",     ldt("2026-10-12T10:00:00"));
        ensureRoom(wId, tdProp, tdb, "TDB-301", "Phòng B301 - Penthouse Studio", 3, bd("50"), bd("12000000"), RoomStatus.OCCUPIED,  "Căn penthouse tầng thượng",             null);
        // Cầu Giấy
        ensureRoom(wId, cgProp, cgB, "CG-201",  "Phòng 201 - Khép Kín Gác Xếp", 2, bd("22"), bd("4500000"), RoomStatus.OCCUPIED,   "Phòng gác lửng, tủ lạnh, điều hòa",    null);
        ensureRoom(wId, cgProp, cgB, "CG-202",  "Phòng 202 - Khép Kín Ban Công", 2, bd("25"), bd("5000000"), RoomStatus.OCCUPIED,   "Ban công phơi đồ riêng biệt",           null);
        ensureRoom(wId, cgProp, cgB, "CG-301",  "Phòng 301 - Khép Kín Cửa Sổ",  3, bd("22"), bd("4500000"), RoomStatus.AVAILABLE,  "Phòng tầng 3 yên tĩnh",                 ldt("2026-10-18T14:00:00"));
        ensureRoom(wId, cgProp, cgB, "CG-302",  "Phòng 302 - Khép Kín Ban Công", 3, bd("25"), bd("5000000"), RoomStatus.OCCUPIED,   "Nội thất cơ bản, máy giặt chung",       null);
        ensureRoom(wId, cgProp, cgB, "CG-401",  "Phòng 401 - Khép Kín Cao Cấp",  4, bd("28"), bd("5500000"), RoomStatus.OCCUPIED,   "Phòng rộng có ban công lớn",            null);
        // Bình Thạnh
        ensureRoom(wId, btProp, btB, "BT-201",  "Phòng 201 - Mini Studio 1",     2, bd("28"), bd("7000000"), RoomStatus.OCCUPIED,   "Studio tiện nghi đầy đủ máy giặt sấy", null);
        ensureRoom(wId, btProp, btB, "BT-202",  "Phòng 202 - Mini Studio 2",     2, bd("28"), bd("7000000"), RoomStatus.OCCUPIED,   "Phòng đẹp sạch sẽ có bếp riêng",        null);
        ensureRoom(wId, btProp, btB, "BT-301",  "Phòng 301 - Studio River View", 3, bd("32"), bd("8000000"), RoomStatus.AVAILABLE,  "View sông mát mẻ quanh năm",             ldt("2026-10-20T09:00:00"));
        ensureRoom(wId, btProp, btB, "BT-401",  "Phòng 401 - Studio River View", 4, bd("32"), bd("8000000"), RoomStatus.OCCUPIED,   "Căn studio view đẹp nhất tòa",           null);
    }

    private Room ensureRoom(long wId, long propId, long bldId, String code, String name,
                            int floor, BigDecimal area, BigDecimal rent,
                            RoomStatus status, String desc, LocalDateTime availSince) {
        return rooms.findByRoomCodeAndWorkspaceId(code, wId).orElseGet(() -> {
            log.debug("[DataInitializer] Creating room: {}", code);
            Room r = new Room(wId, propId, bldId);
            r.update(code, name, floor, area, rent, status, desc);
            if (availSince != null && status == RoomStatus.AVAILABLE) {
                // set availableSince via update sets it only on status change;
                // force it by calling the same update again after save won't work,
                // so we do it via reflection-safe setter pattern: use a fresh update
                // that re-triggers the availableSince assignment.
                r.update(code, name, floor, area, rent, RoomStatus.OCCUPIED, desc); // reset
                r.update(code, name, floor, area, rent, RoomStatus.AVAILABLE, desc); // triggers availableSince = utcNow()
            }
            return rooms.save(r);
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // 6. TENANTS
    // ══════════════════════════════════════════════════════════════════
    private void seedTenants() {
        long wId = 1L;
        ensureTenant(wId, "Nguyễn Hoàng Nam",  "0909123456", "nam.nh@gmail.com",   "079200001234", ld("1995-04-12"), "Hải Châu, Đà Nẵng",        "Bố: 0909999888");
        ensureTenant(wId, "Trần Thị Thu Trang","0918765432", "trang.ttt@gmail.com","079300005678", ld("1998-08-25"), "Quận 3, TP.HCM",             "Mẹ: 0918111222");
        ensureTenant(wId, "Phạm Minh Đức",     "0982345678", "duc.pm@gmail.com",   "001200009876", ld("1992-11-03"), "Đống Đa, Hà Nội",           "Vợ: 0982999000");
        ensureTenant(wId, "Vũ Hải Đăng",       "0971234567", "dang.vh@gmail.com",  "001300008765", ld("1996-02-17"), "Ba Đình, Hà Nội",           "Anh trai: 0971555666");
        ensureTenant(wId, "Lê Mỹ Duyên",       "0934567890", "duyen.lm@gmail.com", "079100004321", ld("1999-07-09"), "Biên Hòa, Đồng Nai",        "Chị gái: 0934111333");
        ensureTenant(wId, "Đặng Quốc Bảo",     "0903456789", "bao.dq@gmail.com",   "079200007890", ld("1994-09-30"), "Nha Trang, Khánh Hòa",      "Bố: 0903888777");
        ensureTenant(wId, "Hoàng Kim Ngân",     "0945678901", "ngan.hk@gmail.com",  "001200003456", ld("2000-01-15"), "Việt Trì, Phú Thọ",         "Mẹ: 0945222444");
        ensureTenant(wId, "Bùi Đình Trọng",    "0912345679", "trong.bd@gmail.com", "079300002345", ld("1997-06-22"), "Tân Bình, TP.HCM",          "Bạn thân: 0912000111");
        ensureTenant(wId, "Chu Ngọc Anh",      "0967890123", "anh.cn@gmail.com",   "001200006789", ld("1993-12-05"), "Cầu Giấy, Hà Nội",          "Bố: 0967333555");
        ensureTenant(wId, "Võ Tấn Phát",       "0923456781", "phat.vt@gmail.com",  "079100008901", ld("1991-03-18"), "Cần Thơ",                    "Mẹ: 0923777999");
    }

    private Tenant ensureTenant(long wId, String name, String phone, String email,
                                String identity, LocalDate dob, String address, String emergency) {
        return tenants.findByPhoneAndWorkspaceId(phone, wId).orElseGet(() -> {
            log.debug("[DataInitializer] Creating tenant: {}", name);
            Tenant t = new Tenant(wId);
            t.update(name, phone, email, identity, dob, address, emergency, RecordStatus.ACTIVE);
            return tenants.save(t);
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // 7. CONTRACTS
    // ══════════════════════════════════════════════════════════════════
    private void seedContracts() {
        long wId = 1L;
        long propTd = propId("PROP_TD01"), propCg = propId("PROP_CG01"), propBt = propId("PROP_BT01");

        // Sắp hết hạn trong 17 ngày
        ensureContract(wId, propTd, "HD_TD_101", tId("0909123456"), rId("TDA-101"),
            ld("2025-11-12"), ld("2026-11-12"), bd("7500000"), bd("15000000"),
            "Hợp đồng thuê 1 năm, đóng tiền ngày 05 hàng tháng");
        // Sắp hết hạn trong 25 ngày
        ensureContract(wId, propCg, "HD_CG_201", tId("0982345678"), rId("CG-201"),
            ld("2025-11-20"), ld("2026-11-20"), bd("4500000"), bd("4500000"),
            "Hợp đồng thuê phòng sinh viên, thanh toán đầu tháng");
        // Hợp đồng dài hạn
        ensureContract(wId, propTd, "HD_TD_102", tId("0918765432"), rId("TDA-102"),
            ld("2026-03-01"), ld("2027-03-01"), bd("7500000"), bd("15000000"),
            "Thuê căn hộ studio tầng 1");
        ensureContract(wId, propTd, "HD_TD_201", tId("0971234567"), rId("TDA-201"),
            ld("2026-06-01"), ld("2027-06-01"), bd("8500000"), bd("17000000"),
            "Thuê căn hộ studio tầng 2 view hồ bơi");
        ensureContract(wId, propTd, "HD_TD_301", tId("0934567890"), rId("TDA-301"),
            ld("2026-01-15"), ld("2027-01-15"), bd("10500000"), bd("21000000"),
            "Thuê căn hộ 1PN cao cấp");
        ensureContract(wId, propTd, "HD_TDB_101", tId("0903456789"), rId("TDB-101"),
            ld("2026-05-10"), ld("2027-05-10"), bd("9500000"), bd("19000000"),
            "Thuê căn hộ 1PN Garden View");
        ensureContract(wId, propTd, "HD_TDB_301", tId("0945678901"), rId("TDB-301"),
            ld("2026-04-01"), ld("2027-04-01"), bd("12000000"), bd("24000000"),
            "Thuê penthouse studio");
        ensureContract(wId, propCg, "HD_CG_202", tId("0912345679"), rId("CG-202"),
            ld("2026-02-01"), ld("2027-02-01"), bd("5000000"), bd("5000000"),
            "Thuê phòng Cầu Giấy tầng 2");
        ensureContract(wId, propCg, "HD_CG_302", tId("0967890123"), rId("CG-302"),
            ld("2026-07-01"), ld("2027-07-01"), bd("5000000"), bd("5000000"),
            "Thuê phòng Cầu Giấy tầng 3");
        ensureContract(wId, propCg, "HD_CG_401", tId("0923456781"), rId("CG-401"),
            ld("2026-08-01"), ld("2027-08-01"), bd("5500000"), bd("5500000"),
            "Thuê phòng Cầu Giấy tầng 4");
        ensureContract(wId, propBt, "HD_BT_201", tId("0909123456"), rId("BT-201"),
            ld("2026-05-01"), ld("2027-05-01"), bd("7000000"), bd("14000000"),
            "Thuê căn hộ mini Bình Thạnh 201");
        ensureContract(wId, propBt, "HD_BT_202", tId("0918765432"), rId("BT-202"),
            ld("2026-09-01"), ld("2027-09-01"), bd("7000000"), bd("14000000"),
            "Thuê căn hộ mini Bình Thạnh 202");
        ensureContract(wId, propBt, "HD_BT_401", tId("0934567890"), rId("BT-401"),
            ld("2026-01-01"), ld("2027-01-01"), bd("8000000"), bd("16000000"),
            "Thuê căn hộ studio River View 401");
    }

    private Contract ensureContract(long wId, long propId, String code, long tenantId, long roomId,
                                    LocalDate start, LocalDate end,
                                    BigDecimal rent, BigDecimal deposit, String terms) {
        return contracts.findByContractCodeAndWorkspaceId(code, wId).orElseGet(() -> {
            log.debug("[DataInitializer] Creating contract: {}", code);
            Contract c = new Contract(wId, propId, tenantId, roomId);
            c.edit(code, start, end, rent, deposit, terms);
            c.activate();
            return contracts.save(c);
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // 8. INVOICES
    // ══════════════════════════════════════════════════════════════════
    private void seedInvoices() {
        long wId = 1L;
        long propTd = propId("PROP_TD01"), propCg = propId("PROP_CG01"), propBt = propId("PROP_BT01");

        // PAID invoices
        ensureInvoice(wId, propTd, tId("0909123456"), rId("TDA-101"), cId("HD_TD_101"),
            "INV_202610_001", ld("2026-10-01"), ld("2026-10-10"),
            bd("7500000"), bd("650000"), bd("150000"), bd("200000"), bd("0"),
            InvoiceStatus.PAID, bd("8500000"));

        ensureInvoice(wId, propTd, tId("0971234567"), rId("TDA-201"), cId("HD_TD_201"),
            "INV_202610_003", ld("2026-10-01"), ld("2026-10-10"),
            bd("8500000"), bd("780000"), bd("180000"), bd("200000"), bd("0"),
            InvoiceStatus.PAID, bd("9660000"));

        ensureInvoice(wId, propTd, tId("0934567890"), rId("TDA-301"), cId("HD_TD_301"),
            "INV_202610_004", ld("2026-10-01"), ld("2026-10-10"),
            bd("10500000"), bd("920000"), bd("200000"), bd("300000"), bd("0"),
            InvoiceStatus.PAID, bd("11920000"));

        ensureInvoice(wId, propTd, tId("0903456789"), rId("TDB-101"), cId("HD_TDB_101"),
            "INV_202610_005", ld("2026-10-01"), ld("2026-10-10"),
            bd("9500000"), bd("850000"), bd("150000"), bd("250000"), bd("0"),
            InvoiceStatus.PAID, bd("10750000"));

        ensureInvoice(wId, propTd, tId("0945678901"), rId("TDB-301"), cId("HD_TDB_301"),
            "INV_202610_006", ld("2026-10-01"), ld("2026-10-10"),
            bd("12000000"), bd("1100000"), bd("250000"), bd("350000"), bd("0"),
            InvoiceStatus.PAID, bd("13700000"));

        ensureInvoice(wId, propCg, tId("0912345679"), rId("CG-202"), cId("HD_CG_202"),
            "INV_202610_008", ld("2026-10-01"), ld("2026-10-10"),
            bd("5000000"), bd("420000"), bd("100000"), bd("150000"), bd("0"),
            InvoiceStatus.PAID, bd("5670000"));

        ensureInvoice(wId, propCg, tId("0923456781"), rId("CG-401"), cId("HD_CG_401"),
            "INV_202610_010", ld("2026-10-01"), ld("2026-10-10"),
            bd("5500000"), bd("480000"), bd("120000"), bd("150000"), bd("0"),
            InvoiceStatus.PAID, bd("6250000"));

        ensureInvoice(wId, propBt, tId("0909123456"), rId("BT-201"), cId("HD_BT_201"),
            "INV_202610_011", ld("2026-10-01"), ld("2026-10-10"),
            bd("7000000"), bd("550000"), bd("120000"), bd("200000"), bd("0"),
            InvoiceStatus.PAID, bd("7870000"));

        ensureInvoice(wId, propBt, tId("0934567890"), rId("BT-401"), cId("HD_BT_401"),
            "INV_202610_013", ld("2026-10-01"), ld("2026-10-10"),
            bd("8000000"), bd("680000"), bd("150000"), bd("200000"), bd("0"),
            InvoiceStatus.PAID, bd("9030000"));

        // UNPAID / OVERDUE invoices — trigger AI Outstanding Debt Warning
        ensureInvoice(wId, propTd, tId("0918765432"), rId("TDA-102"), cId("HD_TD_102"),
            "INV_202610_002", ld("2026-10-01"), ld("2026-10-15"),
            bd("7500000"), bd("670000"), bd("150000"), bd("200000"), bd("0"),
            InvoiceStatus.ISSUED, bd("0"));

        ensureInvoice(wId, propCg, tId("0982345678"), rId("CG-201"), cId("HD_CG_201"),
            "INV_202610_007", ld("2026-10-01"), ld("2026-10-15"),
            bd("4500000"), bd("380000"), bd("100000"), bd("170000"), bd("0"),
            InvoiceStatus.PARTIALLY_PAID, bd("2500000"));

        ensureInvoice(wId, propCg, tId("0967890123"), rId("CG-302"), cId("HD_CG_302"),
            "INV_202610_009", ld("2026-10-01"), ld("2026-10-28"),
            bd("5000000"), bd("400000"), bd("100000"), bd("150000"), bd("0"),
            InvoiceStatus.ISSUED, bd("0"));

        ensureInvoice(wId, propBt, tId("0918765432"), rId("BT-202"), cId("HD_BT_202"),
            "INV_202610_012", ld("2026-10-01"), ld("2026-10-27"),
            bd("7000000"), bd("520000"), bd("130000"), bd("200000"), bd("0"),
            InvoiceStatus.ISSUED, bd("0"));
    }

    private Invoice ensureInvoice(long wId, long propId, long tenantId, long roomId, long contractId,
                                  String code, LocalDate billingMonth, LocalDate dueDate,
                                  BigDecimal rent, BigDecimal elec, BigDecimal water,
                                  BigDecimal service, BigDecimal other,
                                  InvoiceStatus ignoredStatus, BigDecimal paidAmount) {
        return invoices.findByInvoiceCodeAndWorkspaceId(code, wId).orElseGet(() -> {
            log.debug("[DataInitializer] Creating invoice: {}", code);
            Invoice inv = new Invoice(wId, propId, tenantId, roomId, contractId);
            inv.edit(code, billingMonth, dueDate, rent, elec, water, service, other);
            inv.issue(); // → ISSUED
            if (paidAmount.signum() > 0) {
                inv.applyPayment(paidAmount);
            }
            return invoices.save(inv);
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // 9. PAYMENTS
    // ══════════════════════════════════════════════════════════════════
    private void seedPayments() {
        long wId = 1L;

        ensurePayment(wId, invId("INV_202610_001"), "PAY_202610_001", bd("8500000"),
            PaymentMethod.BANK_TRANSFER, ld("2026-10-06"), "MBB-883921",
            "Nguyễn Hoàng Nam chuyển khoản tiền thuê P.101");
        ensurePayment(wId, invId("INV_202610_003"), "PAY_202610_003", bd("9660000"),
            PaymentMethod.BANK_TRANSFER, ld("2026-10-07"), "VCB-291033",
            "Vũ Hải Đăng chuyển khoản tiền thuê P.201");
        ensurePayment(wId, invId("INV_202610_004"), "PAY_202610_004", bd("11920000"),
            PaymentMethod.BANK_TRANSFER, ld("2026-10-08"), "TCB-554109",
            "Lê Mỹ Duyên chuyển khoản tiền phòng P.301");
        ensurePayment(wId, invId("INV_202610_005"), "PAY_202610_005", bd("10750000"),
            PaymentMethod.BANK_TRANSFER, ld("2026-10-07"), "BIDV-99214",
            "Đặng Quốc Bảo thanh toán tiền phòng B101");
        ensurePayment(wId, invId("INV_202610_006"), "PAY_202610_006", bd("13700000"),
            PaymentMethod.BANK_TRANSFER, ld("2026-10-09"), "ACB-772183",
            "Hoàng Kim Ngân thanh toán căn Penthouse B301");
        ensurePayment(wId, invId("INV_202610_007"), "PAY_202610_007", bd("2500000"),
            PaymentMethod.CASH, ld("2026-10-12"), "CASH-REC-07",
            "Phạm Minh Đức nộp tiền mặt đợt 1 phòng 201");
        ensurePayment(wId, invId("INV_202610_008"), "PAY_202610_008", bd("5670000"),
            PaymentMethod.BANK_TRANSFER, ld("2026-10-09"), "VPB-102938",
            "Bùi Đình Trọng chuyển khoản tiền phòng CG-202");
        ensurePayment(wId, invId("INV_202610_010"), "PAY_202610_010", bd("6250000"),
            PaymentMethod.BANK_TRANSFER, ld("2026-10-08"), "VCB-991823",
            "Võ Tấn Phát chuyển khoản tiền phòng CG-401");
        ensurePayment(wId, invId("INV_202610_011"), "PAY_202610_011", bd("7870000"),
            PaymentMethod.BANK_TRANSFER, ld("2026-10-05"), "MBB-334190",
            "Nguyễn Hoàng Nam thanh toán phòng BT-201");
        ensurePayment(wId, invId("INV_202610_013"), "PAY_202610_013", bd("9030000"),
            PaymentMethod.BANK_TRANSFER, ld("2026-10-06"), "TCB-881290",
            "Lê Mỹ Duyên thanh toán phòng BT-401");
    }

    private void ensurePayment(long wId, long invoiceId, String code, BigDecimal amount,
                               PaymentMethod method, LocalDate date, String ref, String note) {
        if (!payments.existsByPaymentCodeAndWorkspaceId(code, wId)) {
            log.debug("[DataInitializer] Creating payment: {}", code);
            payments.save(new Payment(wId, invoiceId, code, amount, method, date, ref, note));
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // 10. MAINTENANCE REQUESTS
    // ══════════════════════════════════════════════════════════════════
    private void seedMaintenance() {
        long wId = 1L;
        Long staffId = users.findByEmail("staff@holoka.vn").map(AppUser::getId).orElse(null);

        // OPEN — rò rỉ bồn rửa chén P.302
        if (!maintenance.existsByRequestCodeAndWorkspaceId("MR_2026_001", wId)) {
            log.debug("[DataInitializer] Creating maintenance: MR_2026_001");
            MaintenanceRequest mr = new MaintenanceRequest(
                wId, propId("PROP_TD01"), bldId("BLD_TDA"), rId("TDA-302"),
                null, "MR_2026_001", ldt("2026-10-25T15:30:00"));
            mr.edit("Rò rỉ ống thoát nước bồn rửa chén P.302",
                "Nước rò rỉ dưới tủ bếp, cần thay van xả và xi-phông mới", Priority.HIGH);
            mr.costs(bd("450000"), bd("0"));
            maintenance.save(mr);
        }

        // IN_PROGRESS — sửa điều hòa CG-201
        if (!maintenance.existsByRequestCodeAndWorkspaceId("MR_2026_002", wId)) {
            log.debug("[DataInitializer] Creating maintenance: MR_2026_002");
            MaintenanceRequest mr = new MaintenanceRequest(
                wId, propId("PROP_CG01"), bldId("BLD_CG01"), rId("CG-201"),
                tId("0982345678"), "MR_2026_002", ldt("2026-10-24T09:15:00"));
            mr.edit("Bảo trì máy lạnh phòng CG-201 kém mát",
                "Máy lạnh Daikin 9000BTU thổi gió không lạnh, nghi nghẹt lưới lọc hoặc thiếu gas",
                Priority.MEDIUM);
            mr.assign(staffId);
            mr.costs(bd("650000"), bd("0"));
            maintenance.save(mr);
        }

        // COMPLETED — thay đèn hành lang
        if (!maintenance.existsByRequestCodeAndWorkspaceId("MR_2026_003", wId)) {
            log.debug("[DataInitializer] Creating maintenance: MR_2026_003");
            MaintenanceRequest mr = new MaintenanceRequest(
                wId, propId("PROP_TD01"), bldId("BLD_TDA"), null,
                null, "MR_2026_003", ldt("2026-10-18T10:00:00"));
            mr.edit("Thay đèn chiếu sáng lối thoát hiểm tầng 2 & 3",
                "Đã thay 4 bóng tuýp LED Rạng Đông 18W, hoạt động tốt", Priority.LOW);
            mr.assign(staffId);
            mr.costs(bd("300000"), bd("280000"));
            mr.transition(MaintenanceStatus.COMPLETED, ldt("2026-10-18T14:30:00"));
            maintenance.save(mr);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // 11. TASKS
    // ══════════════════════════════════════════════════════════════════
    private void seedTasks() {
        long wId = 1L;
        Long staffId   = users.findByEmail("staff@holoka.vn").map(AppUser::getId).orElse(null);
        Long managerId = users.findByEmail("manager@holoka.vn").map(AppUser::getId).orElse(null);

        ensureTask(wId, propId("PROP_TD01"), null, staffId,
            "Kiểm tra định kỳ áp suất bình chữa cháy & PCCC Tòa Thảo Điền",
            "Kiểm tra 16 bình bột MFZ4 và chuông báo cháy toàn bộ 2 Block A & B",
            Priority.HIGH, TaskStatus.TODO, ld("2026-10-30"));

        ensureTask(wId, propId("PROP_CG01"), null, managerId,
            "Chốt chỉ số công tơ điện nước đầu tháng 11 tại Cầu Giấy",
            "Ghi nhận chỉ số điện nước từng phòng để lập hóa đơn tháng 11",
            Priority.MEDIUM, TaskStatus.TODO, ld("2026-11-01"));

        ensureTask(wId, propId("PROP_BT01"), null, staffId,
            "Bảo trì định kỳ máy bơm nước tăng áp tầng mái Bình Thạnh",
            "Kiểm tra rơ-le áp lực và van 1 chiều của máy bơm",
            Priority.LOW, TaskStatus.IN_PROGRESS, ld("2026-10-28"));
    }

    private void ensureTask(long wId, long propId, Long roomId, Long assigneeId,
                            String title, String desc, Priority priority,
                            TaskStatus status, LocalDate dueDate) {
        if (!tasks.existsByTitleAndWorkspaceId(title, wId)) {
            log.debug("[DataInitializer] Creating task: {}", title);
            Task t = new Task(wId, propId, roomId);
            t.edit(title, desc, priority);
            t.assign(assigneeId);
            t.due(dueDate);
            if (status != TaskStatus.TODO) {
                t.transition(status, null);
            }
            tasks.save(t);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // Helper lookup methods (resolve IDs from codes/phones at seed time)
    // ══════════════════════════════════════════════════════════════════

    private long propId(String code) {
        return properties.findByCodeAndWorkspaceId(code, 1L)
            .map(Property::getId)
            .orElseThrow(() -> new IllegalStateException("Property not found: " + code));
    }

    private long bldId(String code) {
        return buildings.findByCodeAndWorkspaceId(code, 1L)
            .map(Building::getId)
            .orElseThrow(() -> new IllegalStateException("Building not found: " + code));
    }

    private long rId(String roomCode) {
        return rooms.findByRoomCodeAndWorkspaceId(roomCode, 1L)
            .map(Room::getId)
            .orElseThrow(() -> new IllegalStateException("Room not found: " + roomCode));
    }

    private long tId(String phone) {
        return tenants.findByPhoneAndWorkspaceId(phone, 1L)
            .map(Tenant::getId)
            .orElseThrow(() -> new IllegalStateException("Tenant not found: " + phone));
    }

    private long cId(String contractCode) {
        return contracts.findByContractCodeAndWorkspaceId(contractCode, 1L)
            .map(Contract::getId)
            .orElseThrow(() -> new IllegalStateException("Contract not found: " + contractCode));
    }

    private long invId(String invCode) {
        return invoices.findByInvoiceCodeAndWorkspaceId(invCode, 1L)
            .map(Invoice::getId)
            .orElseThrow(() -> new IllegalStateException("Invoice not found: " + invCode));
    }

    // ── Convenience factory methods ───────────────────────────────────
    private static BigDecimal bd(String val) { return new BigDecimal(val); }
    private static LocalDate  ld(String s)   { return LocalDate.parse(s); }
    private static LocalDateTime ldt(String s){ return LocalDateTime.parse(s); }
}
