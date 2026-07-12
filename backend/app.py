from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_connection
from config import SECRET_KEY


app = Flask(__name__)
app.secret_key = SECRET_KEY

CORS(app)



# ==========================
# HOME
# ==========================

@app.route("/")
def home():

    return jsonify({
        "message":"TransitOps Backend Running Successfully"
    })




# ==========================
# LOGIN API
# ==========================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")


    try:

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)


        cursor.execute("""
            SELECT *
            FROM users
            WHERE email=%s
            AND password=%s
        """,
        (
            email,
            password
        ))


        user = cursor.fetchone()


        cursor.close()
        conn.close()



        if user:

            return jsonify({

                "success":True,
                "role":user["role"],
                "name":user["full_name"]

            })


        return jsonify({

            "success":False,
            "message":"Invalid Email or Password"

        }),401



    except Exception as e:

        return jsonify({

            "success":False,
            "message":str(e)

        }),500





# ==========================
# DASHBOARD API
# ==========================

@app.route("/api/dashboard", methods=["GET"])
def dashboard():

    try:

        conn=get_connection()
        cursor=conn.cursor(dictionary=True)



        # TOTAL VEHICLES

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM vehicles
        """)

        totalVehicles=cursor.fetchone()["total"]



        # AVAILABLE DRIVERS

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM drivers
            WHERE status='Available'
        """)

        availableDrivers=cursor.fetchone()["total"]



        # ACTIVE TRIPS

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM trips
            WHERE trip_status='Dispatched'
        """)

        activeTrips=cursor.fetchone()["total"]



        # VEHICLES IN SHOP

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM vehicles
            WHERE status='In Shop'
        """)

        vehiclesInShop=cursor.fetchone()["total"]




        # VEHICLE STATUS CHART

        cursor.execute("""
            SELECT 
            status,
            COUNT(*) AS value
            FROM vehicles
            GROUP BY status
        """)


        statusData=cursor.fetchall()



        colors={

            "Available":"#10b981",
            "On Trip":"#6366f1",
            "In Shop":"#f59e0b",
            "Retired":"#ef4444"

        }



        vehicleStatus=[]


        for item in statusData:


            vehicleStatus.append({

                "name":item["status"],
                "value":item["value"],
                "color":colors.get(
                    item["status"],
                    "#64748b"
                )

            })






        # RECENT TRIPS


        cursor.execute("""

        SELECT

        t.trip_id,
        t.source,
        t.destination,
        t.cargo_weight,
        t.planned_distance,
        t.trip_status,


        v.vehicle_name,
        v.registration_no,


        d.full_name


        FROM trips t


        LEFT JOIN vehicles v
        ON t.vehicle_id=v.vehicle_id


        LEFT JOIN drivers d
        ON t.driver_id=d.driver_id


        ORDER BY t.created_at DESC

        LIMIT 5


        """)


        recentTrips=cursor.fetchall()



        cursor.close()
        conn.close()



        return jsonify({


            "summary":{

                "totalVehicles":totalVehicles,
                "availableDrivers":availableDrivers,
                "activeTrips":activeTrips,
                "vehiclesInShop":vehiclesInShop

            },


            "vehicleStatus":vehicleStatus,


            "recentTrips":recentTrips


        })



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500







# ==========================
# VEHICLE MANAGEMENT
# ==========================



# GET ALL VEHICLES

@app.route("/api/vehicles", methods=["GET"])
def get_vehicles():

    try:

        conn=get_connection()
        cursor=conn.cursor(dictionary=True)


        cursor.execute("""

            SELECT *
            FROM vehicles
            ORDER BY vehicle_id DESC

        """)


        vehicles=cursor.fetchall()


        cursor.close()
        conn.close()


        return jsonify(vehicles)



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500






# ADD VEHICLE


@app.route("/api/vehicles", methods=["POST"])
def add_vehicle():


    try:

        data=request.get_json()



        conn=get_connection()
        cursor=conn.cursor()



        cursor.execute("""

        INSERT INTO vehicles

        (
        vehicle_name,
        registration_no,
        vehicle_type,
        max_capacity,
        odometer,
        acquisition_cost,
        status,
        driver_id
        )


        VALUES
        (%s,%s,%s,%s,%s,%s,%s,%s)


        """,
        (

        data.get("vehicle_name"),
        data.get("registration_no"),
        data.get("vehicle_type"),
        data.get("max_capacity"),
        data.get("odometer"),
        data.get("acquisition_cost"),
        data.get("status"),
        data.get("driver_id")

        ))



        conn.commit()


        cursor.close()
        conn.close()



        return jsonify({

            "success":True,
            "message":"Vehicle Added Successfully"

        })



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500






# UPDATE VEHICLE STATUS


@app.route("/api/vehicles/<int:id>", methods=["PUT"])
def update_vehicle(id):

    try:

        data=request.get_json()


        conn=get_connection()
        cursor=conn.cursor()


        if "registration_no" in data:
            cursor.execute("""

            UPDATE vehicles

            SET vehicle_name=%s,
                registration_no=%s,
                vehicle_type=%s,
                max_capacity=%s,
                odometer=%s,
                acquisition_cost=%s,
                status=%s,
                driver_id=%s

            WHERE vehicle_id=%s


            """,
            (

            data.get("vehicle_name"),
            data.get("registration_no"),
            data.get("vehicle_type"),
            data.get("max_capacity"),
            data.get("odometer"),
            data.get("acquisition_cost"),
            data.get("status"),
            data.get("driver_id"),
            id

            ))
        else:
            cursor.execute("""

            UPDATE vehicles

            SET status=%s

            WHERE vehicle_id=%s


            """,
            (

            data.get("status"),
            id

            ))



        conn.commit()


        cursor.close()
        conn.close()



        return jsonify({

            "success":True,
            "message":"Vehicle Updated"

        })



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500






# DELETE VEHICLE


@app.route("/api/vehicles/<int:id>", methods=["DELETE"])
def delete_vehicle(id):


    try:

        conn=get_connection()
        cursor=conn.cursor()


        cursor.execute("""

        DELETE FROM vehicles

        WHERE vehicle_id=%s

        """,
        (id,))


        conn.commit()


        cursor.close()
        conn.close()



        return jsonify({

            "success":True,
            "message":"Vehicle Deleted"

        })



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500

# ==========================
# DRIVER MANAGEMENT API
# ==========================


# GET ALL DRIVERS

@app.route("/api/drivers", methods=["GET"])
def get_drivers():

    try:

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)


        cursor.execute("""
            SELECT *
            FROM drivers
            ORDER BY driver_id DESC
        """)


        drivers = cursor.fetchall()


        cursor.close()
        conn.close()


        return jsonify(drivers)


    except Exception as e:

        return jsonify({

            "success":False,
            "message":str(e)

        }),500






# ADD DRIVER

@app.route("/api/drivers", methods=["POST"])
def add_driver():

    try:

        data=request.get_json()


        conn=get_connection()
        cursor=conn.cursor()


        cursor.execute("""

        INSERT INTO drivers

        (
        full_name,
        license_number,
        license_category,
        license_expiry,
        contact_number,
        safety_score,
        status,
        assigned_vehicle_id
        )


        VALUES
        (%s,%s,%s,%s,%s,%s,%s,%s)


        """,
        (

        data.get("full_name"),
        data.get("license_number"),
        data.get("license_category"),
        data.get("license_expiry"),
        data.get("contact_number"),
        data.get("safety_score"),
        data.get("status"),
        data.get("assigned_vehicle_id")

        ))



        conn.commit()


        cursor.close()
        conn.close()



        return jsonify({

            "success":True,
            "message":"Driver Added Successfully"

        })



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500






# UPDATE DRIVER STATUS

@app.route("/api/drivers/<int:id>", methods=["PUT"])
def update_driver(id):

    try:

        data=request.get_json()


        conn=get_connection()
        cursor=conn.cursor()


        if "license_number" in data:
            cursor.execute("""

            UPDATE drivers

            SET full_name=%s,
                license_number=%s,
                license_category=%s,
                license_expiry=%s,
                contact_number=%s,
                safety_score=%s,
                status=%s,
                assigned_vehicle_id=%s

            WHERE driver_id=%s


            """,
            (

            data.get("full_name"),
            data.get("license_number"),
            data.get("license_category"),
            data.get("license_expiry"),
            data.get("contact_number"),
            data.get("safety_score"),
            data.get("status"),
            data.get("assigned_vehicle_id"),
            id

            ))
        else:
            cursor.execute("""

            UPDATE drivers

            SET status=%s

            WHERE driver_id=%s


            """,
            (

            data.get("status"),
            id

            ))



        conn.commit()


        cursor.close()
        conn.close()



        return jsonify({

            "success":True,
            "message":"Driver Updated"

        })



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500






# DELETE DRIVER

@app.route("/api/drivers/<int:id>", methods=["DELETE"])
def delete_driver(id):

    try:

        conn=get_connection()
        cursor=conn.cursor()


        cursor.execute("""

        DELETE FROM drivers

        WHERE driver_id=%s


        """,
        (id,))



        conn.commit()


        cursor.close()
        conn.close()



        return jsonify({

            "success":True,
            "message":"Driver Deleted"

        })


    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500

# ==========================
# TRIP MANAGEMENT API
# ==========================


# GET ALL TRIPS

@app.route("/api/trips", methods=["GET"])
def get_trips():

    try:

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)


        cursor.execute("""
        
        SELECT
        t.trip_id,
        t.vehicle_id,
        t.driver_id,
        t.source,
        t.destination,
        t.cargo_weight,
        t.planned_distance,
        t.trip_status,
        t.created_at,
        v.vehicle_name,
        v.registration_no,
        d.full_name
        FROM trips t
        LEFT JOIN vehicles v
        ON t.vehicle_id = v.vehicle_id
        LEFT JOIN drivers d
        ON t.driver_id = d.driver_id
        ORDER BY t.trip_id DESC

        """)


        trips = cursor.fetchall()


        cursor.close()
        conn.close()


        return jsonify(trips)



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500







# CREATE TRIP

@app.route("/api/trips", methods=["POST"])
def add_trip():

    try:

        data=request.get_json()


        conn=get_connection()
        cursor=conn.cursor()


        cursor.execute("""

        INSERT INTO trips

        (
        vehicle_id,
        driver_id,
        source,
        destination,
        cargo_weight,
        planned_distance,
        trip_status
        )


        VALUES

        (%s,%s,%s,%s,%s,%s,%s)


        """,
        (

        data.get("vehicle_id"),
        data.get("driver_id"),
        data.get("source"),
        data.get("destination"),
        data.get("cargo_weight"),
        data.get("planned_distance"),
        data.get("trip_status")

        ))



        conn.commit()


        cursor.close()
        conn.close()



        return jsonify({

            "success":True,
            "message":"Trip Created Successfully"

        })



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500







# UPDATE TRIP STATUS

@app.route("/api/trips/<int:id>", methods=["PUT"])
def update_trip(id):

    try:

        data=request.get_json()
        status=data.get("trip_status")


        conn=get_connection()
        cursor=conn.cursor(dictionary=True)


        cursor.execute("SELECT * FROM trips WHERE trip_id=%s", (id,))
        trip = cursor.fetchone()


        if not trip:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "Trip not found"}), 404


        vehicle_id = trip["vehicle_id"]
        driver_id = trip["driver_id"]


        if status == "Dispatched":
            cursor.execute("UPDATE vehicles SET status='On Trip' WHERE vehicle_id=%s", (vehicle_id,))
            cursor.execute("UPDATE drivers SET status='On Trip' WHERE driver_id=%s", (driver_id,))
            cursor.execute("UPDATE trips SET trip_status=%s WHERE trip_id=%s", (status, id))
        elif status == "Completed":
            final_odo = data.get("final_odometer")
            fuel_cons = data.get("fuel_consumed")


            cursor.execute("""
                UPDATE trips
                SET trip_status=%s, final_odometer=%s, fuel_consumed=%s
                WHERE trip_id=%s
            """, (status, final_odo, fuel_cons, id))


            cursor.execute("UPDATE vehicles SET status='Available', odometer=%s WHERE vehicle_id=%s", (final_odo, vehicle_id))
            cursor.execute("UPDATE drivers SET status='Available' WHERE driver_id=%s", (driver_id,))


            if fuel_cons:
                liters = float(fuel_cons)
                cost = liters * 92.0
                cursor.execute("""
                    INSERT INTO fuel_logs (vehicle_id, liters, fuel_cost, fuel_date)
                    VALUES (%s, %s, %s, CURDATE())
                """, (vehicle_id, liters, cost))
        elif status == "Cancelled":
            if trip["trip_status"] in ["Dispatched", "In Progress"]:
                cursor.execute("UPDATE vehicles SET status='Available' WHERE vehicle_id=%s", (vehicle_id,))
                cursor.execute("UPDATE drivers SET status='Available' WHERE driver_id=%s", (driver_id,))
            cursor.execute("UPDATE trips SET trip_status=%s WHERE trip_id=%s", (status, id))
        else:
            cursor.execute("UPDATE trips SET trip_status=%s WHERE trip_id=%s", (status, id))


        conn.commit()


        cursor.close()
        conn.close()



        return jsonify({

            "success":True,

            "message":f"Trip status updated to {status}"

        })



    except Exception as e:


        return jsonify({

            "success":False,

            "message":str(e)

        }),500








# DELETE TRIP

@app.route("/api/trips/<int:id>", methods=["DELETE"])
def delete_trip(id):

    try:

        conn=get_connection()
        cursor=conn.cursor()


        cursor.execute("""

        DELETE FROM trips

        WHERE trip_id=%s

        """,
        (id,))



        conn.commit()


        cursor.close()
        conn.close()



        return jsonify({

            "success":True,
            "message":"Trip Deleted"

        })



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500

# ==========================
# MAINTENANCE MANAGEMENT API
# ==========================


# GET ALL MAINTENANCE RECORDS

@app.route("/api/maintenance", methods=["GET"])
def get_maintenance():

    try:

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)


        cursor.execute("""

        SELECT

        m.maintenance_id,
        m.vehicle_id,
        m.issue_description,
        m.maintenance_date,
        m.maintenance_status,

        v.vehicle_name,
        v.registration_no


        FROM maintenance m


        LEFT JOIN vehicles v
        ON m.vehicle_id = v.vehicle_id


        ORDER BY m.maintenance_id DESC


        """)


        records = cursor.fetchall()


        cursor.close()
        conn.close()


        return jsonify(records)



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500






# ADD MAINTENANCE RECORD

@app.route("/api/maintenance", methods=["POST"])
def add_maintenance():

    try:

        data=request.get_json()


        conn=get_connection()
        cursor=conn.cursor()



        cursor.execute("""

        INSERT INTO maintenance

        (
        vehicle_id,
        issue_description,
        maintenance_date,
        maintenance_status
        )


        VALUES

        (%s,%s,%s,%s)


        """,
        (

        data.get("vehicle_id"),
        data.get("issue_description"),
        data.get("maintenance_date"),
        data.get("maintenance_status")

        ))



        conn.commit()


        cursor.close()
        conn.close()



        return jsonify({

            "success":True,
            "message":"Maintenance Added Successfully"

        })



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500







# UPDATE MAINTENANCE STATUS

@app.route("/api/maintenance/<int:id>", methods=["PUT"])
def update_maintenance(id):

    try:

        data=request.get_json()


        conn=get_connection()
        cursor=conn.cursor()



        cursor.execute("""

        UPDATE maintenance

        SET maintenance_status=%s

        WHERE maintenance_id=%s


        """,
        (

        data.get("maintenance_status"),
        id

        ))



        conn.commit()


        cursor.close()
        conn.close()



        return jsonify({

            "success":True,
            "message":"Maintenance Updated"

        })



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500
# ==========================
# FUEL LOG MANAGEMENT API
# ==========================


# GET ALL FUEL LOGS

@app.route("/api/fuel_logs", methods=["GET"])
def get_fuel_logs():

    try:

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)


        cursor.execute("""

        SELECT

        f.fuel_id,
        f.vehicle_id,
        f.liters,
        f.fuel_cost,
        f.fuel_date,

        v.vehicle_name,
        v.registration_no


        FROM fuel_logs f


        LEFT JOIN vehicles v

        ON f.vehicle_id = v.vehicle_id


        ORDER BY f.fuel_id DESC


        """)


        logs = cursor.fetchall()


        cursor.close()
        conn.close()


        return jsonify(logs)



    except Exception as e:

        return jsonify({

            "success":False,
            "message":str(e)

        }),500







# ADD FUEL LOG


@app.route("/api/fuel_logs", methods=["POST"])
def add_fuel_log():

    try:

        data=request.get_json()


        conn=get_connection()
        cursor=conn.cursor()


        cursor.execute("""

        INSERT INTO fuel_logs

        (

        vehicle_id,
        liters,
        fuel_cost,
        fuel_date

        )


        VALUES

        (%s,%s,%s,%s)


        """,

        (

        data.get("vehicle_id"),
        data.get("liters"),
        data.get("fuel_cost"),
        data.get("fuel_date")

        ))



        conn.commit()


        cursor.close()
        conn.close()



        return jsonify({

            "success":True,
            "message":"Fuel Log Added Successfully"

        })



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500
# ==========================
# REPORTS API
# ==========================


@app.route("/api/reports", methods=["GET"])
def reports():

    try:

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)


        # VEHICLE SUMMARY

        cursor.execute("""
            SELECT 
            status,
            COUNT(*) AS total
            FROM vehicles
            GROUP BY status
        """)

        vehicleReport = cursor.fetchall()



        # DRIVER SUMMARY

        cursor.execute("""
            SELECT
            status,
            COUNT(*) AS total
            FROM drivers
            GROUP BY status
        """)

        driverReport = cursor.fetchall()



        # TRIP SUMMARY

        cursor.execute("""
            SELECT
            trip_status,
            COUNT(*) AS total
            FROM trips
            GROUP BY trip_status
        """)

        tripReport = cursor.fetchall()



        # MAINTENANCE SUMMARY

        cursor.execute("""
            SELECT
            maintenance_status,
            COUNT(*) AS total
            FROM maintenance
            GROUP BY maintenance_status
        """)

        maintenanceReport = cursor.fetchall()



        # TOTAL FUEL COST

        cursor.execute("""
            SELECT
            SUM(fuel_cost) AS totalFuelExpense
            FROM fuel_logs
        """)

        fuelReport = cursor.fetchone()



        cursor.close()
        conn.close()



        return jsonify({

            "vehicles":vehicleReport,

            "drivers":driverReport,

            "trips":tripReport,

            "maintenance":maintenanceReport,

            "fuelExpense":
            fuelReport["totalFuelExpense"] or 0

        })



    except Exception as e:


        return jsonify({

            "success":False,
            "message":str(e)

        }),500
# ==========================
# RUN SERVER
# ==========================

if __name__=="__main__":
    app.run(debug=True)
