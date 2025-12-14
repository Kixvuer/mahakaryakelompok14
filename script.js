// --- KONSTANTA GLOBAL ---
const k_sal = 0.0162;

// --- FUNGSI MATEMATIKA (ALGORITMA) ---

function algo1_salinity(R, T, P) {
    // Konstanta UNESCO (Sama persis kayak Fortran)
    const a0=0.0080, a1=-0.1692, a2=25.3851, a3=14.0941, a4=-7.0261, a5=2.7081;
    const b0=0.0005, b1=-0.0056, b2=-0.0066, b3=-0.0375, b4=0.0636, b5=-0.0144;
    const c0=0.6766097, c1=2.00564E-2, c2=1.104259E-4, c3=-6.9698E-7, c4=1.0031E-9;
    const d1=3.426E-2, d2=4.464E-4, d3=4.215E-1, d4=-3.107E-3;
    const e1=2.070E-5, e2=-6.370E-10, e3=3.989E-15;

    let DT = T - 15.0;
    let Rp = 1.0 + (P * (e1 + e2*P + e3*Math.pow(P,2))) / (1.0 + d1*T + d2*Math.pow(T,2) + (d3 + d4*T)*R);
    let rt = c0 + T*(c1 + T*(c2 + T*(c3 + T*c4)));
    let Rt = R / (Rp * rt);
    let RT = Math.sqrt(Math.abs(Rt));

    let S = a0 + RT*(a1 + RT*(a2 + RT*(a3 + RT*(a4 + RT*a5)))) + 
            (DT / (1.0 + k_sal*DT)) * (b0 + RT*(b1 + RT*(b2 + RT*(b3 + RT*(b4 + RT*b5)))));
    
    return Math.max(0, S); // Pastikan tidak negatif
}

function algo2_conductivity(S, T, P) {
    // Konstanta
    const a1=-0.1692, a2=25.3851, a3=14.0941, a4=-7.0261, a5=2.7081;
    const b1=-0.0056, b2=-0.0066, b3=-0.0375, b4=0.0636, b5=-0.0144;
    const c0=0.6766097, c1=2.00564E-2, c2=1.104259E-4, c3=-6.9698E-7, c4=1.0031E-9;
    const d1=3.426E-2, d2=4.464E-4, d3=4.215E-1, d4=-3.107E-3;
    const e1=2.070E-5, e2=-6.370E-10, e3=3.989E-15;

    let DT = T - 15.0;
    let RT = Math.sqrt(S / 35.0);
    let DELS = 1.0;
    let i = 0;

    // ITERASI NEWTON-RAPHSON (Versi JS)
    while (DELS > 1.0E-5 && i < 20) {
        i++;
        let SI = 0.0080 + RT*(a1 + RT*(a2 + RT*(a3 + RT*(a4 + RT*a5)))) + 
                 (DT/(1.0+k_sal*DT)) * (0.0005 + RT*(b1 + RT*(b2 + RT*(b3 + RT*(b4 + RT*b5)))));
        
        let DERIV = a1 + RT*(2*a2 + RT*(3*a3 + RT*(4*a4 + RT*5*a5))) + 
                    (DT/(1.0+k_sal*DT)) * (b1 + RT*(2*b2 + RT*(3*b3 + RT*(4*b4 + RT*5*b5))));
        
        RT = RT + (S - SI) / DERIV;
        DELS = Math.abs(S - SI);
    }

    let rt = c0 + T*(c1 + T*(c2 + T*(c3 + T*c4)));
    let A = d3 + d4*T;
    let B = 1.0 + d1*T + d2*Math.pow(T,2);
    let C = P * (e1 + e2*P + e3*Math.pow(P,2));

    let R_pure = Math.pow(RT, 2) * rt;
    let Rp = 1.0 + C / (B + A * R_pure);
    
    return R_pure * Rp;
}

function algo5_freezing(S, P) {
    const a0 = -0.0575, a1 = 1.710523E-3, a2 = -2.154996E-4, b = -7.53E-4;
    return (a0*S) + (a1*S*Math.sqrt(S)) + (a2*Math.pow(S,2)) + (b*P);
}

// --- FUNGSI INTERAKSI WEB ---

function calculate() {
    // Ambil data dari kotak input
    let choice = document.getElementById("algoSelect").value;
    let v1 = parseFloat(document.getElementById("val1").value);
    let v2 = parseFloat(document.getElementById("val2").value);
    let v3 = parseFloat(document.getElementById("val3").value);
    
    let hasil = 0;
    let unit = "";

    // Pilih Rumus
    if (choice == "1") {
        hasil = algo1_salinity(v1, v2, v3);
        unit = " PSU";
    } else if (choice == "2") {
        hasil = algo2_conductivity(v1, v2, v3);
        unit = " (Ratio)";
    } else if (choice == "5") {
        hasil = algo5_freezing(v1, v3); // Pake v3 (Pressure)
        unit = " &deg;C";
    } else {
        alert("Algoritma ini belum dimasukkan ke versi JS demo ini!");
        return;
    }

    // Tampilkan Hasil
    document.getElementById("result").style.display = "block";
    document.getElementById("outputValue").innerHTML = hasil.toFixed(5) + unit;
}

// Fitur biar label input berubah sesuai pilihan
function updateInputs() {
    let choice = document.getElementById("algoSelect").value;
    let l1 = document.getElementById("val1").previousElementSibling;
    let l2 = document.getElementById("val2").previousElementSibling;
    let l3 = document.getElementById("val3").previousElementSibling;

    if (choice == "4") { // Pressure to Depth
        l1.textContent = "Pressure (db):";
        l2.textContent = "Latitude (deg):";
        document.getElementById("val3").style.display = "none";
        l3.style.display = "none";
    } else if (choice == "5") { // Freezing
        l1.textContent = "Salinity:";
        l2.style.display = "none"; // Gak butuh Temp
        document.getElementById("val2").style.display = "none";
        l3.textContent = "Pressure (db):";
    } else {
        // Reset normal
        l1.textContent = "Salinity / Ratio:";
        l2.textContent = "Temperature (C):";
        l3.textContent = "Pressure (db):";
        l2.style.display = "block"; document.getElementById("val2").style.display = "block";
        l3.style.display = "block"; document.getElementById("val3").style.display = "block";
    }
}
