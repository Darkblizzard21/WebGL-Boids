import java.io.File;

public class main {
    public static void main(String[] args) {
        String inPath = ".\\input\\cpp11In.png";
        String outPath = ".\\mediaOut\\cpp21.png";
        ForceFieldGen ffg = new ForceFieldGen(new File(inPath));
        ffg.enableBlur();
        ffg.setBlurCenterWeight(8);
        ffg.gen();
        ffg.save(new File(outPath));
    }

    public static void generated(String in, String out){
        ForceFieldGen ffg = new ForceFieldGen(new File(in));
        ffg.enableBlur();
        ffg.setBlurCenterWeight(8);
        ffg.gen();
        ffg.save(new File(out));
    }
}
