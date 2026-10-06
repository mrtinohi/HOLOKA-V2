package com.holoka.notification;
public enum AlertRule {
    INVOICE_OVERDUE("invoices"), CONTRACT_EXPIRING("contracts"), HIGH_MAINTENANCE("maintenance"), TASK_OVERDUE("tasks"), ROOM_VACANT("rooms");
    private final String route;
    AlertRule(String route){this.route=route;}
    public String path(long id){return "/"+route+"/"+id;}
}
