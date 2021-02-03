<?php
    include "db.php";
    $get_data = "SELECT name, condition, ST_AsGeoJSON(geom) FROM enteries";
    $result = (pg_query($dbconn, $get_data)) or die("connection faield");
    // $result2 = pg_fetch_all(pg_query($dbconn, $get_data));
    // echo "<pre>";
    // print_r($result2);
    // echo "<pre>";
    $geojson = array('type' => 'FeatureCollection', 'features' => array());
    
    if($rows = pg_num_rows($result)>0){
        while($rows = pg_fetch_assoc($result)){
            // echo "$rows['name']";
            echo $rows['st_asgeojson'];
            
        }
    }

    ?>