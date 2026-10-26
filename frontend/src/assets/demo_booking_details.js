const bookings = [
  {
    id: "b1f27f20-7a3e-4bc5-9d12-81a410c4d912",
    user_id: "u89a2c50-3b78-4abd-911a-73e0d1283a10",
    hotel_id: "h12d3e10-9c21-4bf2-aa82-61c55e6b4f21",
    room_id: "r501cdda-81b6-4570-9ef5-2da88e8347c9",

    check_in_date: "2025-12-20",
    check_out_date: "2025-12-23",
    number_of_guests: 2,

    total_amount: 4500,
    tax_amount: 810,
    final_amount: 5310,

    status: "confirmed",
    payment_status: "success",
    payment_method: "credit_card",
    transaction_id: "TXN9823472384",
    card_details: {
      holder_name: "Aman Verma",
      card_number: "5231 5231 5231 5231",
      expiry_date: "2027-06-01",
      cvv: "567"
    },
    special_requests: "Need early check-in at 10 AM",
    cancellation_reason: "",
    cancelled_at: null,

    created_at: "2025-12-10T09:30:00Z",
    updated_at: "2025-12-10T10:15:00Z"
  },

  {
    id: "b718d7d0-2aec-4975-96cf-941522ac5943",
    user_id: "u591d3a11-1c73-4ce8-89f1-8821cb98bc82",
    hotel_id: "h45bd920-2e21-42cf-8d1a-13d22de9fa11",
    room_id: "r88ea0bc-62c4-42f6-8bd7-59b3761cd501",

    check_in_date: "2025-12-24",
    check_out_date: "2025-12-25",
    number_of_guests: 1,

    total_amount: 2000,
    tax_amount: 360,
    final_amount: 2360,

    status: "cancelled",
    payment_status: "refunded",
    payment_method: "upi",
    transaction_id: "TXN4628392047",
    card_details: null,

    special_requests: "High floor room",
    cancellation_reason: "Travel plan postponed",
    cancelled_at: "2025-12-18T17:45:00Z",

    created_at: "2025-12-15T14:20:00Z",
    updated_at: "2025-12-18T18:00:00Z"
  },

  {
    id: "b992ac03-e9a7-4ce0-b83f-4498cbd16280",
    user_id: "u401b9f11-5d64-4c2e-912a-77011ac4af42",
    hotel_id: "h12d3e10-9c21-4bf2-aa82-61c55e6b4f21",
    room_id: "r76b0ee3-91d3-4ed3-8cd7-151fdbc41c22",

    check_in_date: "2026-01-05",
    check_out_date: "2026-01-07",
    number_of_guests: 3,

    total_amount: 6000,
    tax_amount: 1080,
    final_amount: 7080,

    status: "booked",
    payment_status: "pending",
    payment_method: "debit_card",
    transaction_id: "",
    card_details: null,

    special_requests: "",
    cancellation_reason: "",
    cancelled_at: null,

    created_at: "2025-12-22T11:40:00Z",
    updated_at: "2025-12-22T11:40:00Z"
  },

  {
    id: "bf83db72-5fb3-4b3a-9044-8adeb1cb74c2",
    user_id: "u88bbcc23-8891-401a-b92b-a56ed92077f1",
    hotel_id: "h92db12d0-8122-4af8-8871-7182ec09cb79",
    room_id: "r09ac7ca-55f4-4b76-9139-4210f79b7db8",

    check_in_date: "2026-01-10",
    check_out_date: "2026-01-12",
    number_of_guests: 2,

    total_amount: 3500,
    tax_amount: 630,
    final_amount: 4130,

    status: "completed",
    payment_status: "success",
    payment_method: "cash",
    transaction_id: "TXN6002947293",
    card_details: null,

    special_requests: "Late checkout till 2 PM",
    cancellation_reason: "",
    cancelled_at: null,

    created_at: "2025-12-25T18:50:00Z",
    updated_at: "2026-01-12T15:20:00Z"
  },

  {
    id: "c023d9c4-46c5-4468-aa8b-3688cd91f034",
    user_id: "u725a12ea-56d1-425c-8bf0-ff4bc2f79ff3",
    hotel_id: "h45bd920-2e21-42cf-8d1a-13d22de9fa11",
    room_id: "r221a67c-836b-4061-82a1-4ee5ca8cf022",

    check_in_date: "2026-01-15",
    check_out_date: "2026-01-16",
    number_of_guests: 1,

    total_amount: 1800,
    tax_amount: 324,
    final_amount: 2124,

    status: "confirmed",
    payment_status: "success",
    payment_method: "upi",
    transaction_id: "TXN8829374894",
    card_details: null,

    special_requests: "",
    cancellation_reason: "",
    cancelled_at: null,

    created_at: "2026-01-01T10:10:00Z",
    updated_at: "2026-01-01T10:30:00Z"
  }
];

export default bookings;
