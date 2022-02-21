package util;

public class MMath {
    public static double clamp(double value, double min, double max){
        return Math.min(max,Math.max(min, value));
    }
    public static int clamp(int value, int min, int max){
        return Math.min(max,Math.max(min, value));
    }
}
