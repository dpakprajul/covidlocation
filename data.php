<?php
    include "db.php";
    $get_data = "SELECT name, condition, ST_AsGeoJSON(geom) FROM enteries";
    $result = pg_fetch_all(pg_query($dbconn, $get_data));
    echo json_encode($result)
    
    
    ?>