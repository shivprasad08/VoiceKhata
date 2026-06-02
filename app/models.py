from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
import enum

from sqlalchemy import (
    Column, Integer, String, Numeric, DateTime, Date, ForeignKey, 
    Enum, Boolean, Text
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

from .database import Base


class TransactionType(str, enum.Enum):
    SALE = "sale"
    EXPENSE = "expense"


class UdharType(str, enum.Enum):
    GIVEN = "given"
    TAKEN = "taken"


class UdharStatus(str, enum.Enum):
    PENDING = "pending"
    SETTLED = "settled"


class SummaryPeriod(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    business_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    udhars: Mapped[List["Udhar"]] = relationship("Udhar", back_populates="user", cascade="all, delete-orphan")
    gst_records: Mapped[List["GSTRecord"]] = relationship("GSTRecord", back_populates="user", cascade="all, delete-orphan")
    summaries: Mapped[List["SummaryCache"]] = relationship("SummaryCache", back_populates="user", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vendor_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today, index=True)
    
    gst_applicable: Mapped[bool] = mapped_column(Boolean, default=False)
    gst_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    gst_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="transactions")
    gst_record: Mapped[Optional["GSTRecord"]] = relationship("GSTRecord", back_populates="transaction", uselist=False, cascade="all, delete-orphan")


class Udhar(Base):
    __tablename__ = "udhar"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    type: Mapped[UdharType] = mapped_column(Enum(UdharType), nullable=False)
    status: Mapped[UdharStatus] = mapped_column(Enum(UdharStatus), nullable=False, default=UdharStatus.PENDING, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="udhars")


class GSTRecord(Base):
    __tablename__ = "gst_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    transaction_id: Mapped[int] = mapped_column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), unique=True, index=True)
    
    gstin: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    hsn_sac: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    
    cgst: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    sgst: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    igst: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    total_tax: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="gst_records")
    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="gst_record")


class SummaryCache(Base):
    __tablename__ = "summaries_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    period: Mapped[SummaryPeriod] = mapped_column(Enum(SummaryPeriod), nullable=False, index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    total_sales: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    total_expenses: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    total_udhar_given: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    total_udhar_taken: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="summaries")
