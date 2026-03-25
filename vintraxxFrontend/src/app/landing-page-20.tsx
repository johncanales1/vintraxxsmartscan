"use client";

import { Fragment, type ReactNode, type SVGProps, useState } from "react";
import { FileIcon } from "@untitledui/file-icons";
import { ArrowRight, CheckCircle, LayersThree01, LayersTwo01, PlayCircle, Trash01, UploadCloud02, Zap } from "@untitledui/icons";
import { AnimatePresence, type Transition, motion } from "motion/react";
import { PaginationDot } from "@/components/application/pagination/pagination-dot";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { PlayButtonIcon } from "@/components/foundations/play-button-icon";
import { StarIcon } from "@/components/foundations/rating-stars";
import { AngelList, Dribbble, Facebook, GitHub, Layers, LinkedIn, X } from "@/components/foundations/social-icons";
import { Header } from "@/components/marketing/header-navigation/header";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";

const FlowPattern = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg viewBox="0 0 298 408" fill="none" {...props} className={cx("hidden w-48.5 text-fg-quaternary opacity-30 md:block md:w-74.5", props.className)}>
            <g>
                <line x1="203.24" y1="12.7244" x2="207.5" y2="1.01986" stroke="currentColor" strokeWidth="2" />
                <line x1="229.864" y1="12.1777" x2="236.092" y2="1.39079" stroke="currentColor" strokeWidth="2" />
                <line x1="256.656" y1="11.6453" x2="264.662" y2="2.10368" stroke="currentColor" strokeWidth="2" />
                <line x1="283.65" y1="10.7437" x2="293.192" y2="2.73735" stroke="currentColor" strokeWidth="2" />
                <line x1="17.7088" y1="12.2758" x2="8.16716" y2="4.26944" stroke="currentColor" strokeWidth="2" />
                <line x1="44.4605" y1="12.9309" x2="36.4542" y2="3.38926" stroke="currentColor" strokeWidth="2" />
                <line x1="71.0519" y1="13.1777" x2="64.8241" y2="2.39079" stroke="currentColor" strokeWidth="2" />
                <line x1="97.5291" y1="13.4084" x2="93.269" y2="1.7039" stroke="currentColor" strokeWidth="2" />
                <line x1="123.937" y1="13.6297" x2="121.774" y2="1.36324" stroke="currentColor" strokeWidth="2" />
                <line x1="150.324" y1="13.4561" x2="150.324" y2="1.00036" stroke="currentColor" strokeWidth="2" />
                <line x1="176.742" y1="13.2824" x2="178.905" y2="1.01594" stroke="currentColor" strokeWidth="2" />
                <line x1="175.217" y1="34.5222" x2="179.477" y2="22.8177" stroke="currentColor" strokeWidth="2" />
                <line x1="201.837" y1="33.9746" x2="208.065" y2="23.1877" stroke="currentColor" strokeWidth="2" />
                <line x1="228.628" y1="33.4431" x2="236.635" y2="23.9015" stroke="currentColor" strokeWidth="2" />
                <line x1="255.627" y1="32.5416" x2="265.168" y2="24.5352" stroke="currentColor" strokeWidth="2" />
                <line x1="282.859" y1="31.2736" x2="293.646" y2="25.0458" stroke="currentColor" strokeWidth="2" />
                <line x1="16.4371" y1="34.7287" x2="8.43071" y2="25.1871" stroke="currentColor" strokeWidth="2" />
                <line x1="43.0285" y1="34.9746" x2="36.8007" y2="24.1877" stroke="currentColor" strokeWidth="2" />
                <line x1="69.5017" y1="35.2063" x2="65.2416" y2="23.5018" stroke="currentColor" strokeWidth="2" />
                <line x1="95.9097" y1="35.4266" x2="93.7468" y2="23.1601" stroke="currentColor" strokeWidth="2" />
                <line x1="122.297" y1="35.2529" x2="122.297" y2="22.7972" stroke="currentColor" strokeWidth="2" />
                <line x1="148.718" y1="35.0793" x2="150.881" y2="22.8128" stroke="currentColor" strokeWidth="2" />
                <line x1="147.189" y1="56.3201" x2="151.449" y2="44.6156" stroke="currentColor" strokeWidth="2" />
                <line x1="173.814" y1="55.7725" x2="180.042" y2="44.9855" stroke="currentColor" strokeWidth="2" />
                <line x1="200.605" y1="55.24" x2="208.611" y2="45.6984" stroke="currentColor" strokeWidth="2" />
                <line x1="227.603" y1="54.3384" x2="237.145" y2="46.3321" stroke="currentColor" strokeWidth="2" />
                <line x1="254.836" y1="53.0705" x2="265.623" y2="46.8427" stroke="currentColor" strokeWidth="2" />
                <line x1="282.33" y1="52.2185" x2="294.034" y2="47.9584" stroke="currentColor" strokeWidth="2" />
                <line x1="15.0012" y1="56.7725" x2="8.77331" y2="45.9855" stroke="currentColor" strokeWidth="2" />
                <line x1="41.4783" y1="57.0041" x2="37.2182" y2="45.2996" stroke="currentColor" strokeWidth="2" />
                <line x1="67.8863" y1="57.2244" x2="65.7234" y2="44.958" stroke="currentColor" strokeWidth="2" />
                <line x1="94.2734" y1="57.0508" x2="94.2734" y2="44.5951" stroke="currentColor" strokeWidth="2" />
                <line x1="120.691" y1="56.8771" x2="122.854" y2="44.6107" stroke="currentColor" strokeWidth="2" />
                <line x1="119.166" y1="78.117" x2="123.426" y2="66.4124" stroke="currentColor" strokeWidth="2" />
                <line x1="145.786" y1="77.5703" x2="152.014" y2="66.7834" stroke="currentColor" strokeWidth="2" />
                <line x1="172.578" y1="77.0379" x2="180.584" y2="67.4963" stroke="currentColor" strokeWidth="2" />
                <line x1="199.576" y1="76.1363" x2="209.118" y2="68.1299" stroke="currentColor" strokeWidth="2" />
                <line x1="226.812" y1="74.8683" x2="237.599" y2="68.6405" stroke="currentColor" strokeWidth="2" />
                <line x1="254.306" y1="74.0164" x2="266.011" y2="69.7563" stroke="currentColor" strokeWidth="2" />
                <line x1="282.08" y1="72.8033" x2="294.347" y2="70.6404" stroke="currentColor" strokeWidth="2" />
                <line x1="13.4509" y1="78.801" x2="9.19083" y2="67.0965" stroke="currentColor" strokeWidth="2" />
                <line x1="39.8589" y1="79.0223" x2="37.696" y2="66.7558" stroke="currentColor" strokeWidth="2" />
                <line x1="66.2461" y1="78.8486" x2="66.2461" y2="66.3929" stroke="currentColor" strokeWidth="2" />
                <line x1="92.6675" y1="78.675" x2="94.8304" y2="66.4085" stroke="currentColor" strokeWidth="2" />
                <line x1="91.1384" y1="99.9148" x2="95.3985" y2="88.2103" stroke="currentColor" strokeWidth="2" />
                <line x1="117.763" y1="99.3672" x2="123.991" y2="88.5802" stroke="currentColor" strokeWidth="2" />
                <line x1="144.554" y1="98.8357" x2="152.561" y2="89.2941" stroke="currentColor" strokeWidth="2" />
                <line x1="171.553" y1="97.9332" x2="181.094" y2="89.9268" stroke="currentColor" strokeWidth="2" />
                <line x1="198.785" y1="96.6662" x2="209.572" y2="90.4384" stroke="currentColor" strokeWidth="2" />
                <line x1="226.279" y1="95.8132" x2="237.984" y2="91.5531" stroke="currentColor" strokeWidth="2" />
                <line x1="254.053" y1="94.6011" x2="266.319" y2="92.4382" stroke="currentColor" strokeWidth="2" />
                <line x1="11.8355" y1="100.819" x2="9.6726" y2="88.5527" stroke="currentColor" strokeWidth="2" />
                <line x1="38.2227" y1="100.646" x2="38.2227" y2="88.1898" stroke="currentColor" strokeWidth="2" />
                <line x1="64.6402" y1="100.472" x2="66.8031" y2="88.2054" stroke="currentColor" strokeWidth="2" />
                <line x1="297.68" y1="95.418" x2="285.224" y2="95.418" stroke="currentColor" strokeWidth="2" />
                <line x1="63.115" y1="121.712" x2="67.3751" y2="110.007" stroke="currentColor" strokeWidth="2" />
                <line x1="89.7355" y1="121.165" x2="95.9634" y2="110.378" stroke="currentColor" strokeWidth="2" />
                <line x1="116.527" y1="120.633" x2="124.533" y2="111.091" stroke="currentColor" strokeWidth="2" />
                <line x1="143.525" y1="119.731" x2="153.067" y2="111.725" stroke="currentColor" strokeWidth="2" />
                <line x1="170.762" y1="118.463" x2="181.549" y2="112.235" stroke="currentColor" strokeWidth="2" />
                <line x1="198.256" y1="117.611" x2="209.96" y2="113.351" stroke="currentColor" strokeWidth="2" />
                <line x1="226.029" y1="116.398" x2="238.296" y2="114.235" stroke="currentColor" strokeWidth="2" />
                <line x1="10.1953" y1="122.443" x2="10.1953" y2="109.988" stroke="currentColor" strokeWidth="2" />
                <line x1="36.6168" y1="122.27" x2="38.7797" y2="110.003" stroke="currentColor" strokeWidth="2" />
                <line x1="269.652" y1="117.216" x2="257.197" y2="117.216" stroke="currentColor" strokeWidth="2" />
                <line x1="297.365" y1="118.368" x2="285.099" y2="116.205" stroke="currentColor" strokeWidth="2" />
                <line x1="35.0877" y1="143.51" x2="39.3478" y2="131.805" stroke="currentColor" strokeWidth="2" />
                <line x1="61.7121" y1="142.962" x2="67.9399" y2="132.175" stroke="currentColor" strokeWidth="2" />
                <line x1="88.5035" y1="142.43" x2="96.5099" y2="132.889" stroke="currentColor" strokeWidth="2" />
                <line x1="115.502" y1="141.529" x2="125.043" y2="133.523" stroke="currentColor" strokeWidth="2" />
                <line x1="142.734" y1="140.261" x2="153.521" y2="134.033" stroke="currentColor" strokeWidth="2" />
                <line x1="170.228" y1="139.409" x2="181.933" y2="135.149" stroke="currentColor" strokeWidth="2" />
                <line x1="198.002" y1="138.196" x2="210.269" y2="136.033" stroke="currentColor" strokeWidth="2" />
                <line x1="8.58941" y1="144.068" x2="10.7523" y2="131.801" stroke="currentColor" strokeWidth="2" />
                <line x1="241.629" y1="139.013" x2="229.173" y2="139.013" stroke="currentColor" strokeWidth="2" />
                <line x1="269.338" y1="140.165" x2="257.072" y2="138.003" stroke="currentColor" strokeWidth="2" />
                <line x1="296.775" y1="141.288" x2="285.071" y2="137.028" stroke="currentColor" strokeWidth="2" />
                <line x1="7.06421" y1="165.307" x2="11.3243" y2="153.603" stroke="currentColor" strokeWidth="2" />
                <line x1="33.6848" y1="164.76" x2="39.9126" y2="153.973" stroke="currentColor" strokeWidth="2" />
                <line x1="60.4761" y1="164.227" x2="68.4825" y2="154.686" stroke="currentColor" strokeWidth="2" />
                <line x1="87.4744" y1="163.326" x2="97.016" y2="155.319" stroke="currentColor" strokeWidth="2" />
                <line x1="114.711" y1="162.058" x2="125.498" y2="155.83" stroke="currentColor" strokeWidth="2" />
                <line x1="142.205" y1="161.206" x2="153.909" y2="156.946" stroke="currentColor" strokeWidth="2" />
                <line x1="169.979" y1="159.994" x2="182.245" y2="157.831" stroke="currentColor" strokeWidth="2" />
                <line x1="295.93" y1="163.79" x2="285.143" y2="157.562" stroke="currentColor" strokeWidth="2" />
                <line x1="213.605" y1="160.811" x2="201.15" y2="160.811" stroke="currentColor" strokeWidth="2" />
                <line x1="241.315" y1="161.963" x2="229.048" y2="159.8" stroke="currentColor" strokeWidth="2" />
                <line x1="268.748" y1="163.085" x2="257.043" y2="158.825" stroke="currentColor" strokeWidth="2" />
                <line x1="5.66132" y1="186.558" x2="11.8892" y2="175.771" stroke="currentColor" strokeWidth="2" />
                <line x1="32.4527" y1="186.025" x2="40.4591" y2="176.484" stroke="currentColor" strokeWidth="2" />
                <line x1="59.451" y1="185.124" x2="68.9926" y2="177.117" stroke="currentColor" strokeWidth="2" />
                <line x1="86.6836" y1="183.856" x2="97.4705" y2="177.628" stroke="currentColor" strokeWidth="2" />
                <line x1="114.178" y1="183.004" x2="125.882" y2="178.744" stroke="currentColor" strokeWidth="2" />
                <line x1="141.951" y1="181.791" x2="154.218" y2="179.628" stroke="currentColor" strokeWidth="2" />
                <line x1="267.902" y1="185.588" x2="257.115" y2="179.36" stroke="currentColor" strokeWidth="2" />
                <line x1="294.853" y1="186.656" x2="285.312" y2="178.649" stroke="currentColor" strokeWidth="2" />
                <line x1="185.578" y1="182.607" x2="173.122" y2="182.607" stroke="currentColor" strokeWidth="2" />
                <line x1="213.287" y1="183.76" x2="201.021" y2="181.597" stroke="currentColor" strokeWidth="2" />
                <line x1="240.724" y1="184.883" x2="229.02" y2="180.623" stroke="currentColor" strokeWidth="2" />
                <line x1="4.42536" y1="207.823" x2="12.4317" y2="198.281" stroke="currentColor" strokeWidth="2" />
                <line x1="31.4236" y1="206.92" x2="40.9652" y2="198.914" stroke="currentColor" strokeWidth="2" />
                <line x1="58.6602" y1="205.654" x2="69.4471" y2="199.426" stroke="currentColor" strokeWidth="2" />
                <line x1="86.1541" y1="204.802" x2="97.8586" y2="200.541" stroke="currentColor" strokeWidth="2" />
                <line x1="113.928" y1="203.588" x2="126.194" y2="201.426" stroke="currentColor" strokeWidth="2" />
                <line x1="239.879" y1="207.386" x2="229.092" y2="201.158" stroke="currentColor" strokeWidth="2" />
                <line x1="266.826" y1="208.453" x2="257.284" y2="200.446" stroke="currentColor" strokeWidth="2" />
                <line x1="293.578" y1="209.109" x2="285.571" y2="199.567" stroke="currentColor" strokeWidth="2" />
                <line x1="157.555" y1="204.405" x2="145.099" y2="204.405" stroke="currentColor" strokeWidth="2" />
                <line x1="185.264" y1="205.558" x2="172.997" y2="203.395" stroke="currentColor" strokeWidth="2" />
                <line x1="212.701" y1="206.681" x2="200.996" y2="202.421" stroke="currentColor" strokeWidth="2" />
                <line x1="3.40018" y1="228.718" x2="12.9418" y2="220.712" stroke="currentColor" strokeWidth="2" />
                <line x1="30.6328" y1="227.45" x2="41.4198" y2="221.223" stroke="currentColor" strokeWidth="2" />
                <line x1="58.1267" y1="226.598" x2="69.8313" y2="222.338" stroke="currentColor" strokeWidth="2" />
                <line x1="85.9006" y1="225.385" x2="98.167" y2="223.222" stroke="currentColor" strokeWidth="2" />
                <line x1="211.852" y1="229.182" x2="201.065" y2="222.955" stroke="currentColor" strokeWidth="2" />
                <line x1="238.803" y1="230.25" x2="229.261" y2="222.244" stroke="currentColor" strokeWidth="2" />
                <line x1="265.55" y1="230.905" x2="257.544" y2="221.364" stroke="currentColor" strokeWidth="2" />
                <line x1="292.146" y1="231.152" x2="285.918" y2="220.365" stroke="currentColor" strokeWidth="2" />
                <line x1="129.527" y1="226.203" x2="117.072" y2="226.203" stroke="currentColor" strokeWidth="2" />
                <line x1="157.237" y1="227.355" x2="144.97" y2="225.192" stroke="currentColor" strokeWidth="2" />
                <line x1="184.674" y1="228.478" x2="172.969" y2="224.218" stroke="currentColor" strokeWidth="2" />
                <line x1="2.60938" y1="249.248" x2="13.3963" y2="243.02" stroke="currentColor" strokeWidth="2" />
                <line x1="30.1033" y1="248.396" x2="41.8078" y2="244.136" stroke="currentColor" strokeWidth="2" />
                <line x1="57.8771" y1="247.183" x2="70.1436" y2="245.02" stroke="currentColor" strokeWidth="2" />
                <line x1="183.828" y1="250.98" x2="173.041" y2="244.752" stroke="currentColor" strokeWidth="2" />
                <line x1="210.775" y1="252.048" x2="201.234" y2="244.042" stroke="currentColor" strokeWidth="2" />
                <line x1="237.527" y1="252.703" x2="229.521" y2="243.162" stroke="currentColor" strokeWidth="2" />
                <line x1="264.118" y1="252.949" x2="257.891" y2="242.162" stroke="currentColor" strokeWidth="2" />
                <line x1="290.595" y1="253.181" x2="286.335" y2="241.476" stroke="currentColor" strokeWidth="2" />
                <line x1="101.504" y1="248" x2="89.0482" y2="248" stroke="currentColor" strokeWidth="2" />
                <line x1="129.213" y1="249.153" x2="116.947" y2="246.99" stroke="currentColor" strokeWidth="2" />
                <line x1="156.65" y1="250.276" x2="144.946" y2="246.016" stroke="currentColor" strokeWidth="2" />
                <line x1="2.07595" y1="270.193" x2="13.7805" y2="265.933" stroke="currentColor" strokeWidth="2" />
                <line x1="29.8498" y1="268.981" x2="42.1163" y2="266.818" stroke="currentColor" strokeWidth="2" />
                <line x1="155.801" y1="272.778" x2="145.014" y2="266.55" stroke="currentColor" strokeWidth="2" />
                <line x1="182.752" y1="273.845" x2="173.21" y2="265.839" stroke="currentColor" strokeWidth="2" />
                <line x1="209.503" y1="274.5" x2="201.497" y2="264.959" stroke="currentColor" strokeWidth="2" />
                <line x1="236.095" y1="274.747" x2="229.867" y2="263.96" stroke="currentColor" strokeWidth="2" />
                <line x1="262.568" y1="274.979" x2="258.308" y2="263.274" stroke="currentColor" strokeWidth="2" />
                <line x1="288.976" y1="275.199" x2="286.813" y2="262.933" stroke="currentColor" strokeWidth="2" />
                <line x1="73.4766" y1="269.798" x2="61.0209" y2="269.798" stroke="currentColor" strokeWidth="2" />
                <line x1="101.186" y1="270.951" x2="88.9193" y2="268.788" stroke="currentColor" strokeWidth="2" />
                <line x1="128.623" y1="272.073" x2="116.918" y2="267.812" stroke="currentColor" strokeWidth="2" />
                <line x1="1.82635" y1="290.778" x2="14.0928" y2="288.615" stroke="currentColor" strokeWidth="2" />
                <line x1="127.777" y1="294.575" x2="116.99" y2="288.347" stroke="currentColor" strokeWidth="2" />
                <line x1="154.724" y1="295.643" x2="145.183" y2="287.637" stroke="currentColor" strokeWidth="2" />
                <line x1="181.476" y1="296.298" x2="173.47" y2="286.756" stroke="currentColor" strokeWidth="2" />
                <line x1="208.068" y1="296.545" x2="201.84" y2="285.758" stroke="currentColor" strokeWidth="2" />
                <line x1="234.545" y1="296.776" x2="230.285" y2="285.071" stroke="currentColor" strokeWidth="2" />
                <line x1="260.953" y1="296.997" x2="258.79" y2="284.73" stroke="currentColor" strokeWidth="2" />
                <line x1="287.34" y1="296.823" x2="287.34" y2="284.368" stroke="currentColor" strokeWidth="2" />
                <line x1="45.4531" y1="291.595" x2="32.9974" y2="291.595" stroke="currentColor" strokeWidth="2" />
                <line x1="73.1623" y1="292.748" x2="60.8958" y2="290.585" stroke="currentColor" strokeWidth="2" />
                <line x1="100.599" y1="293.87" x2="88.8949" y2="289.61" stroke="currentColor" strokeWidth="2" />
                <line x1="99.75" y1="316.373" x2="88.9631" y2="310.145" stroke="currentColor" strokeWidth="2" />
                <line x1="126.701" y1="317.44" x2="117.159" y2="309.434" stroke="currentColor" strokeWidth="2" />
                <line x1="153.453" y1="318.096" x2="145.446" y2="308.554" stroke="currentColor" strokeWidth="2" />
                <line x1="180.044" y1="318.342" x2="173.816" y2="307.555" stroke="currentColor" strokeWidth="2" />
                <line x1="206.517" y1="318.573" x2="202.257" y2="306.869" stroke="currentColor" strokeWidth="2" />
                <line x1="232.925" y1="318.794" x2="230.762" y2="306.527" stroke="currentColor" strokeWidth="2" />
                <line x1="259.312" y1="318.62" x2="259.312" y2="306.164" stroke="currentColor" strokeWidth="2" />
                <line x1="285.734" y1="318.446" x2="287.897" y2="306.18" stroke="currentColor" strokeWidth="2" />
                <line x1="17.4258" y1="313.393" x2="4.97009" y2="313.393" stroke="currentColor" strokeWidth="2" />
                <line x1="45.1349" y1="314.545" x2="32.8685" y2="312.382" stroke="currentColor" strokeWidth="2" />
                <line x1="72.572" y1="315.668" x2="60.8675" y2="311.408" stroke="currentColor" strokeWidth="2" />
                <line x1="284.205" y1="339.686" x2="288.465" y2="327.982" stroke="currentColor" strokeWidth="2" />
                <line x1="71.7266" y1="338.17" x2="60.9396" y2="331.942" stroke="currentColor" strokeWidth="2" />
                <line x1="98.6736" y1="339.238" x2="89.132" y2="331.231" stroke="currentColor" strokeWidth="2" />
                <line x1="125.425" y1="339.893" x2="117.419" y2="330.351" stroke="currentColor" strokeWidth="2" />
                <line x1="152.017" y1="340.14" x2="145.789" y2="329.353" stroke="currentColor" strokeWidth="2" />
                <line x1="178.494" y1="340.37" x2="174.234" y2="328.666" stroke="currentColor" strokeWidth="2" />
                <line x1="204.902" y1="340.592" x2="202.739" y2="328.325" stroke="currentColor" strokeWidth="2" />
                <line x1="231.289" y1="340.418" x2="231.289" y2="327.962" stroke="currentColor" strokeWidth="2" />
                <line x1="257.707" y1="340.244" x2="259.87" y2="327.978" stroke="currentColor" strokeWidth="2" />
                <line x1="17.1115" y1="336.342" x2="4.84504" y2="334.179" stroke="currentColor" strokeWidth="2" />
                <line x1="44.5486" y1="337.465" x2="32.8441" y2="333.205" stroke="currentColor" strokeWidth="2" />
                <line x1="256.181" y1="361.484" x2="260.441" y2="349.78" stroke="currentColor" strokeWidth="2" />
                <line x1="282.802" y1="360.937" x2="289.03" y2="350.15" stroke="currentColor" strokeWidth="2" />
                <line x1="43.6992" y1="359.968" x2="32.9123" y2="353.74" stroke="currentColor" strokeWidth="2" />
                <line x1="70.6502" y1="361.036" x2="61.1086" y2="353.029" stroke="currentColor" strokeWidth="2" />
                <line x1="97.4019" y1="361.691" x2="89.3956" y2="352.149" stroke="currentColor" strokeWidth="2" />
                <line x1="123.993" y1="361.937" x2="117.766" y2="351.15" stroke="currentColor" strokeWidth="2" />
                <line x1="150.467" y1="362.168" x2="146.206" y2="350.464" stroke="currentColor" strokeWidth="2" />
                <line x1="176.875" y1="362.389" x2="174.712" y2="350.123" stroke="currentColor" strokeWidth="2" />
                <line x1="203.262" y1="362.216" x2="203.262" y2="349.76" stroke="currentColor" strokeWidth="2" />
                <line x1="229.683" y1="362.042" x2="231.846" y2="349.776" stroke="currentColor" strokeWidth="2" />
                <line x1="16.5213" y1="359.263" x2="4.81674" y2="355.003" stroke="currentColor" strokeWidth="2" />
                <line x1="228.154" y1="383.282" x2="232.414" y2="371.577" stroke="currentColor" strokeWidth="2" />
                <line x1="254.779" y1="382.734" x2="261.006" y2="371.947" stroke="currentColor" strokeWidth="2" />
                <line x1="281.57" y1="382.202" x2="289.576" y2="372.66" stroke="currentColor" strokeWidth="2" />
                <line x1="15.6758" y1="381.765" x2="4.88883" y2="375.538" stroke="currentColor" strokeWidth="2" />
                <line x1="42.6228" y1="382.832" x2="33.0812" y2="374.826" stroke="currentColor" strokeWidth="2" />
                <line x1="69.3746" y1="383.488" x2="61.3682" y2="373.946" stroke="currentColor" strokeWidth="2" />
                <line x1="95.966" y1="383.734" x2="89.7382" y2="372.947" stroke="currentColor" strokeWidth="2" />
                <line x1="122.443" y1="383.966" x2="118.183" y2="372.262" stroke="currentColor" strokeWidth="2" />
                <line x1="148.851" y1="384.186" x2="146.688" y2="371.92" stroke="currentColor" strokeWidth="2" />
                <line x1="175.238" y1="384.013" x2="175.238" y2="371.557" stroke="currentColor" strokeWidth="2" />
                <line x1="201.656" y1="383.839" x2="203.819" y2="371.573" stroke="currentColor" strokeWidth="2" />
                <line x1="200.131" y1="405.079" x2="204.391" y2="393.374" stroke="currentColor" strokeWidth="2" />
                <line x1="226.751" y1="404.532" x2="232.979" y2="393.745" stroke="currentColor" strokeWidth="2" />
                <line x1="253.543" y1="404" x2="261.549" y2="394.458" stroke="currentColor" strokeWidth="2" />
                <line x1="280.541" y1="403.098" x2="290.082" y2="395.092" stroke="currentColor" strokeWidth="2" />
                <line x1="14.5994" y1="404.63" x2="5.05778" y2="396.624" stroke="currentColor" strokeWidth="2" />
                <line x1="41.3511" y1="405.285" x2="33.3448" y2="395.744" stroke="currentColor" strokeWidth="2" />
                <line x1="67.9426" y1="405.532" x2="61.7147" y2="394.745" stroke="currentColor" strokeWidth="2" />
                <line x1="94.4158" y1="405.763" x2="90.1557" y2="394.058" stroke="currentColor" strokeWidth="2" />
                <line x1="120.824" y1="405.984" x2="118.661" y2="393.718" stroke="currentColor" strokeWidth="2" />
                <line x1="147.211" y1="405.811" x2="147.211" y2="393.355" stroke="currentColor" strokeWidth="2" />
                <line x1="173.632" y1="405.637" x2="175.795" y2="393.37" stroke="currentColor" strokeWidth="2" />
            </g>
        </svg>
    );
};

const HeroSplitImage03 = () => {
    return (
        <Fragment>
            <Header className="bg-primary" />
            <section className="overflow-hidden bg-primary py-16 md:pb-24">
                <div className="mx-auto grid max-w-container grid-cols-1 items-center gap-16 px-4 md:px-8 lg:grid-cols-2 lg:gap-8">
                    <div className="flex max-w-3xl flex-col items-start lg:pr-8">
                        <h1 className="text-display-md font-semibold text-primary md:text-display-lg lg:text-display-xl">People who care about your growth</h1>
                        <p className="mt-4 max-w-lg text-lg text-balance text-tertiary md:mt-6 md:text-xl">
                            Powerful, self-serve product and growth analytics to help you convert, engage, and retain more.
                        </p>

                        <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-start md:mt-12">
                            <Button color="secondary" size="xl" iconLeading={PlayCircle}>
                                Demo
                            </Button>
                            <Button size="xl">Sign up</Button>
                        </div>
                    </div>

                    <div className="relative lg:h-full lg:min-h-160">
                        {/* Accessory elements. Feel free to replace them with static images */}
                        <div className="absolute bottom-9 -left-18 z-10 hidden w-92 flex-col gap-3 select-none lg:flex">
                            <div className="relative rounded-xl bg-alpha-white/90 p-4 ring ring-secondary_alt backdrop-blur-lg">
                                <div className="relative flex grow items-start justify-start gap-3">
                                    <FileIcon type="mp3" theme="light" className="size-10 dark:hidden" />
                                    <FileIcon type="mp3" theme="dark" className="size-10 not-dark:hidden" />
                                    <div className="flex flex-1 flex-col items-start justify-start gap-1">
                                        <div className="pr-8">
                                            <p className="text-sm font-medium text-secondary">My Podcast – Episode 1.mp3</p>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <p className="text-sm text-tertiary">20 MB of 20 MB</p>
                                                <hr className="h-3 w-px rounded-t-full rounded-b-full border-none bg-border-primary" />
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle className="size-4 text-fg-success-primary" />
                                                    <p className="text-sm font-medium text-success-primary">Complete</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-start gap-3 self-stretch">
                                            <div className="relative h-2 flex-1 rounded bg-quaternary">
                                                <div className="size-full rounded bg-fg-brand-primary"></div>
                                            </div>
                                            <p className="text-sm font-medium text-secondary">100%</p>
                                        </div>
                                    </div>

                                    <Trash01 className="absolute -top-0.5 -right-0.5 size-4 text-fg-quaternary" />
                                </div>
                            </div>
                            <div className="relative rounded-xl bg-alpha-white/90 p-4 ring ring-secondary_alt backdrop-blur-lg">
                                <div className="relative flex grow items-start justify-start gap-3">
                                    <FileIcon type="mp3" theme="light" className="size-10 dark:hidden" />
                                    <FileIcon type="mp3" theme="dark" className="size-10 not-dark:hidden" />
                                    <div className="flex flex-1 flex-col items-start justify-start gap-1">
                                        <div className="pr-8">
                                            <p className="text-sm font-medium text-secondary">My Podcast – Episode 2.mp3</p>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <p className="text-sm text-tertiary">16 MB of 20 MB</p>
                                                <hr className="h-3 w-px rounded-t-full rounded-b-full border-none bg-border-primary" />
                                                <div className="flex items-center gap-1">
                                                    <UploadCloud02 className="size-4 text-fg-quaternary" />
                                                    <p className="text-sm font-medium text-quaternary">Uploading...</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-start gap-3 self-stretch">
                                            <div className="relative h-2 flex-1 rounded bg-quaternary">
                                                <div className="h-full w-[80%] rounded bg-fg-brand-primary"></div>
                                            </div>
                                            <p className="text-sm font-medium text-secondary">80%</p>
                                        </div>
                                    </div>

                                    <Trash01 className="absolute -top-0.5 -right-0.5 size-4 text-fg-quaternary" />
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-6 right-5 z-10 translate-x-1/2 md:-top-10">
                            <FlowPattern />
                        </div>

                        <img
                            className="inset-0 h-70 w-full rounded-tl-[64px] object-cover md:h-110 md:rounded-tl-[92px] lg:absolute lg:h-full lg:rounded-tl-[160px]"
                            src="https://www.untitledui.com/marketing/man-and-laptop.webp"
                            alt="Man and Laptop"
                        />
                    </div>
                </div>
            </section>
        </Fragment>
    );
};

const SocialProofCard = () => {
    return (
        <section className="bg-primary pb-16 md:pb-24">
            <div className="mx-auto max-w-container md:px-8">
                <div className="flex flex-col gap-8 bg-secondary px-6 py-12 md:rounded-2xl md:p-16">
                    <p className="text-center text-md font-medium text-tertiary md:text-xl">Trusted by 4,000+ companies</p>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 xl:gap-x-8">
                        {/* Light mode images (hidden in dark mode) */}
                        <img alt="Catalog" src="https://www.untitledui.com/logos/logotype/color/catalog.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Pictelai" src="https://www.untitledui.com/logos/logotype/color/pictelai.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Leapyear" src="https://www.untitledui.com/logos/logotype/color/leapyear.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Peregrin" src="https://www.untitledui.com/logos/logotype/color/peregrin.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Easytax" src="https://www.untitledui.com/logos/logotype/color/easytax.svg" className="h-9 md:h-12 dark:hidden" />
                        <img
                            alt="Coreos"
                            src="https://www.untitledui.com/logos/logotype/color/coreos.svg"
                            className="inline-flex h-9 md:hidden md:h-12 dark:hidden"
                        />

                        {/* Dark mode images (hidden in light mode) */}
                        <img
                            alt="Catalog"
                            src="https://www.untitledui.com/logos/logotype/white/catalog.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Pictelai"
                            src="https://www.untitledui.com/logos/logotype/white/pictelai.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Leapyear"
                            src="https://www.untitledui.com/logos/logotype/white/leapyear.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Peregrin"
                            src="https://www.untitledui.com/logos/logotype/white/peregrin.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Easytax"
                            src="https://www.untitledui.com/logos/logotype/white/easytax.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Coreos"
                            src="https://www.untitledui.com/logos/logotype/white/coreos.svg"
                            className="inline-flex h-9 opacity-85 not-dark:hidden md:hidden md:h-12"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

interface FeatureTabProps {
    title: string;
    subtitle: string;
    footer?: ReactNode;
    isCurrent?: boolean;
}

const FeatureTabHorizontal = ({ title, subtitle, footer, isCurrent }: FeatureTabProps) => (
    <div
        className={cx(
            "relative flex cursor-pointer flex-col items-start gap-4 border-l-4 border-tertiary py-4 pl-5 transition duration-100 ease-linear hover:border-brand",
            isCurrent && "border-brand",
        )}
    >
        <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-md text-tertiary">{subtitle}</p>
        </div>

        {footer}
    </div>
);

const FeaturesTabsMockup06 = () => {
    const [currentTab, setCurrentTab] = useState(0);

    return (
        <section className="overflow-hidden bg-primary pb-16 md:pb-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="flex w-full flex-col lg:max-w-3xl">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Features</span>

                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Overflowing with useful features</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-12 md:mt-16 md:gap-16 lg:grid-cols-2 lg:items-center">
                    <ul className="flex flex-col">
                        {[
                            {
                                title: "Share team inboxes",
                                subtitle: "Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.",
                            },
                            {
                                title: "Deliver instant answers",
                                subtitle: "An all-in-one customer service platform that helps you balance everything your customers need to be happy.",
                            },
                            {
                                title: "Manage your team with reports",
                                subtitle:
                                    "Measure what matters with Untitled's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.",
                            },
                        ].map((item, index) => (
                            <li key={item.title} onClick={() => setCurrentTab(index)}>
                                <FeatureTabHorizontal
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    isCurrent={index === currentTab}
                                    footer={
                                        <Button color="link-color" size="lg" href="#" iconTrailing={ArrowRight}>
                                            Learn more
                                        </Button>
                                    }
                                />
                            </li>
                        ))}
                    </ul>

                    <div className="relative -ml-4 flex h-90 w-screen items-start justify-center sm:w-auto lg:h-128">
                        {/* Desktop */}
                        <div className="absolute top-0 left-16 hidden w-max lg:block lg:h-168.5 lg:max-h-168.5">
                            <div className="size-full rounded-[9.03px] bg-primary p-[0.9px] shadow-lg ring-[0.56px] ring-utility-gray-300 ring-inset md:rounded-[26.95px] md:p-[3.5px] md:ring-[1.68px]">
                                <div className="size-full rounded-[7.9px] bg-primary p-0.5 shadow-modern-mockup-inner-md md:rounded-[23.58px] md:p-1 md:shadow-modern-mockup-inner-lg">
                                    <div className="relative size-full overflow-hidden rounded-[6.77px] bg-utility-gray-50 ring-[0.56px] ring-utility-gray-200 md:rounded-[20.21px] md:ring-[1.68px]">
                                        {/* Light mode image (hidden in dark mode) */}
                                        <img
                                            alt="Dashboard mockup showing application interface"
                                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                            className="size-full object-cover object-left-top dark:hidden"
                                        />
                                        {/* Dark mode image (hidden in light mode) */}
                                        <img
                                            alt="Dashboard mockup showing application interface"
                                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                                            className="size-full object-cover object-left-top not-dark:hidden"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="w-max max-w-70 lg:absolute lg:top-26 lg:left-0">
                            <div className="size-full rounded-[23.89px] bg-primary p-[3px] shadow-lg ring-[1.49px] ring-utility-gray-300 ring-inset">
                                <div className="size-full rounded-[20.91px] bg-primary p-1 shadow-modern-mockup-inner-lg">
                                    <div className="relative size-full overflow-hidden rounded-[17.92px] bg-utility-gray-50 ring-[1.49px] ring-utility-gray-200">
                                        {/* Light mode image (hidden in dark mode) */}
                                        <img
                                            alt="Mobile app interface mockup"
                                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                                            className="size-full object-cover object-left-top dark:hidden"
                                        />
                                        {/* Dark mode image (hidden in light mode) */}
                                        <img
                                            alt="Mobile app interface mockup"
                                            src="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                                            className="size-full object-cover object-left-top not-dark:hidden"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const MetricsCardGrayLight = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-8 rounded-2xl bg-secondary px-6 py-10 md:gap-16 md:rounded-none md:bg-transparent md:p-0">
                    <div className="flex w-full flex-col self-center text-center md:max-w-3xl">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Unleash the full power of data</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Everything you need to convert, engage, and retain more users.</p>
                    </div>

                    <dl className="flex flex-col gap-8 rounded-2xl bg-secondary md:flex-row md:p-16">
                        {[
                            { title: "400+", subtitle: "Projects completed" },
                            { title: "600%", subtitle: "Return on investment" },
                            { title: "10k", subtitle: "Global downloads" },
                        ].map((item, index) => (
                            <div key={index} className="flex flex-1 flex-col-reverse gap-3 text-center">
                                <dt className="text-lg font-semibold text-primary">{item.subtitle}</dt>
                                <dd className="text-display-lg font-semibold text-brand-tertiary_alt md:text-display-xl">{item.title}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
};

const CTASimpleLeft = () => {
    return (
        <section className="bg-secondary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col justify-between lg:flex-row">
                    <div className="max-w-3xl">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Start your free trial</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Join over 4,000+ startups already growing with Untitled.</p>
                    </div>

                    <div className="mt-8 flex flex-col-reverse gap-3 self-stretch sm:flex-row sm:self-start lg:mt-0">
                        <Button color="secondary" size="xl">
                            Learn more
                        </Button>
                        <Button size="xl">Get started</Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const plans = [
    {
        title: "Basic plan",
        subtitle: "$10/mth",
        description: "Billed annually.",
        features: [
            "Access to all basic features",
            "Basic reporting and analytics",
            "Up to 10 individual users",
            "20 GB individual data",
            "Basic chat and email support",
        ],
        hasCallout: true,
        icon: Zap,
    },
    {
        title: "Business plan",
        subtitle: "$20/mth",
        description: "Billed annually.",
        features: [
            "200+ integrations",
            "Advanced reporting and analytics",
            "Up to 20 individual users",
            "40 GB individual data",
            "Priority chat and email support",
        ],
        icon: LayersTwo01,
    },
    {
        title: "Enterprise plan",
        subtitle: "$40/mth",
        description: "Billed annually.",
        features: [
            "Advanced custom fields",
            "Audit log and data history",
            "Unlimited individual users",
            "Unlimited individual data",
            "Personalized + priority service",
        ],
        icon: LayersThree01,
    },
];

const CheckItemText = (props: {
    size?: "sm" | "md" | "lg" | "xl";
    text?: string;
    color?: "primary" | "success";
    iconStyle?: "outlined" | "contained" | "filled";
    textClassName?: string;
}) => {
    const { text, color, size, iconStyle = "contained" } = props;

    return (
        <li className="flex gap-3">
            {iconStyle === "contained" && (
                <div
                    className={cx(
                        "flex shrink-0 items-center justify-center rounded-full",
                        color === "success" ? "bg-success-secondary text-featured-icon-light-fg-success" : "bg-brand-primary text-featured-icon-light-fg-brand",
                        size === "lg" ? "size-7 md:h-8 md:w-8" : size === "md" ? "size-7" : "size-6",
                    )}
                >
                    <svg
                        width={size === "lg" ? 16 : size === "md" ? 15 : 13}
                        height={size === "lg" ? 14 : size === "md" ? 13 : 11}
                        viewBox="0 0 13 11"
                        fill="none"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M11.0964 0.390037L3.93638 7.30004L2.03638 5.27004C1.68638 4.94004 1.13638 4.92004 0.736381 5.20004C0.346381 5.49004 0.236381 6.00004 0.476381 6.41004L2.72638 10.07C2.94638 10.41 3.32638 10.62 3.75638 10.62C4.16638 10.62 4.55638 10.41 4.77638 10.07C5.13638 9.60004 12.0064 1.41004 12.0064 1.41004C12.9064 0.490037 11.8164 -0.319963 11.0964 0.380037V0.390037Z"
                            fill="currentColor"
                        />
                    </svg>
                </div>
            )}

            {iconStyle === "filled" && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-solid text-white">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M1.5 4L4.5 7L10.5 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}

            {iconStyle === "outlined" && (
                <CheckCircle
                    className={cx(
                        "shrink-0",
                        color === "success" ? "text-fg-success-primary" : "text-fg-brand-primary",
                        size === "lg" ? "size-7 md:h-8 md:w-8" : size === "md" ? "size-7" : "size-6",
                    )}
                />
            )}

            <span
                className={cx(
                    "text-tertiary",
                    size === "lg" ? "pt-0.5 text-lg md:pt-0" : size === "md" ? "pt-0.5 text-md md:pt-0 md:text-lg" : "text-md",
                    iconStyle === "filled" && "text-brand-secondary",
                    props.textClassName,
                )}
            >
                {text}
            </span>
        </li>
    );
};

const PricingTierCardCallout = (props: {
    title: string;
    subtitle: string;
    description?: string;
    features: string[];
    secondAction?: string;
    checkItemTextColor?: "primary" | "success";
    hasCallout?: boolean;
    className?: string;
}) => {
    return (
        <div className={cx("relative flex flex-col rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt", props.className)}>
            {props.hasCallout && (
                <div className="absolute -top-6 right-2 md:-right-16">
                    <div className="flex text-brand-secondary">
                        <svg width="60" height="46" viewBox="0 0 60 46" fill="none">
                            <path
                                d="M9.22056 42.4485C9.06321 43.2619 9.595 44.0488 10.4084 44.2061C11.2217 44.3635 12.0086 43.8317 12.166 43.0184L9.22056 42.4485ZM50.5841 3.7912C51.405 3.68023 51.9806 2.92474 51.8696 2.10378C51.7586 1.28282 51.0032 0.707267 50.1822 0.818242L50.5841 3.7912ZM4.78725 32.3308C4.36038 31.6208 3.43878 31.3913 2.7288 31.8182C2.01882 32.2451 1.78931 33.1667 2.21618 33.8766L4.78725 32.3308ZM8.9767 42.2098L7.69117 42.9828L7.69189 42.984L8.9767 42.2098ZM12.5932 43.2606L11.9803 41.8916L11.979 41.8921L12.5932 43.2606ZM23.5123 40.0155C24.2684 39.677 24.6069 38.7897 24.2684 38.0336C23.9299 37.2774 23.0425 36.9389 22.2864 37.2774L23.5123 40.0155ZM10.6933 42.7334C12.166 43.0184 12.1659 43.0187 12.1658 43.019C12.1658 43.0189 12.1658 43.0192 12.1658 43.0192C12.1658 43.0192 12.1658 43.0189 12.166 43.0184C12.1662 43.0173 12.1666 43.0152 12.1672 43.012C12.1684 43.0058 12.1705 42.9953 12.1735 42.9808C12.1794 42.9517 12.1887 42.9064 12.2016 42.8456C12.2274 42.7239 12.2676 42.5403 12.3233 42.3008C12.4349 41.8216 12.6088 41.1193 12.8551 40.2421C13.3481 38.4863 14.1291 36.0371 15.2773 33.2782C17.5833 27.7375 21.3236 21.0615 27.0838 16.2002L25.1489 13.9076C18.8763 19.2013 14.905 26.3651 12.5076 32.1255C11.3042 35.0171 10.4856 37.5837 9.96684 39.4311C9.7073 40.3554 9.52235 41.1015 9.40152 41.6204C9.34109 41.8799 9.29667 42.0827 9.26695 42.2227C9.25209 42.2927 9.24091 42.3471 9.23323 42.385C9.22939 42.4039 9.22643 42.4187 9.22432 42.4294C9.22327 42.4347 9.22243 42.4389 9.22181 42.4421C9.22149 42.4437 9.22123 42.4451 9.22103 42.4461C9.22092 42.4467 9.22081 42.4473 9.22075 42.4475C9.22065 42.4481 9.22056 42.4485 10.6933 42.7334ZM27.0838 16.2002C38.8964 6.23107 48.2848 4.10201 50.5841 3.7912L50.1822 0.818242C47.3237 1.20465 37.402 3.56662 25.1489 13.9076L27.0838 16.2002ZM2.21618 33.8766L7.69117 42.9828L10.2622 41.4369L4.78725 32.3308L2.21618 33.8766ZM7.69189 42.984C8.83415 44.8798 11.2204 45.5209 13.2074 44.6291L11.979 41.8921C11.2779 42.2068 10.5661 41.9412 10.2615 41.4357L7.69189 42.984ZM13.2061 44.6297L23.5123 40.0155L22.2864 37.2774L11.9803 41.8916L13.2061 44.6297Z"
                                fill="currentColor"
                            />
                        </svg>
                        <span className="-mt-2 text-sm font-semibold">Most popular!</span>
                    </div>
                </div>
            )}

            <div className="flex flex-col items-center px-6 pt-10 text-center md:px-8">
                <h2 className="text-display-md font-semibold text-primary md:text-display-lg">{props.subtitle}</h2>
                <p className="mt-4 text-xl font-semibold text-primary md:text-xl">{props.title}</p>
                <p className="mt-1 text-md text-tertiary">{props.description}</p>
            </div>

            <ul className="flex flex-col gap-4 px-6 pt-8 pb-8 md:p-8 md:pb-10">
                {props.features.map((feat) => (
                    <CheckItemText key={feat} text={feat} color={props.checkItemTextColor} />
                ))}
            </ul>

            <div className="mt-auto flex flex-col gap-3 px-6 pb-8 md:px-8">
                <Button size="xl">Get started</Button>
                {props.secondAction && (
                    <Button color="secondary" size="xl">
                        {props.secondAction}
                    </Button>
                )}
            </div>
        </div>
    );
};

const PricingSectionSimpleCards02 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex w-full max-w-3xl flex-col">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Pricing</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Simple, transparent pricing</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        We believe Untitled should be accessible to all companies, no matter the size.
                    </p>
                </div>

                <div className="mt-12 grid w-full grid-cols-1 gap-4 md:mt-16 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
                    {plans.map((plan) => (
                        <PricingTierCardCallout key={plan.title} {...plan} checkItemTextColor="success" />
                    ))}
                </div>
            </div>
        </section>
    );
};

const reviews = [
    {
        quote: "Love the simplicity of the service and the prompt customer support. We can't imagine working without it.",
        author: {
            name: "Renee Wells",
            title: "Product Designer, Quotient",
            avatarUrl: "https://www.untitledui.com/images/avatars/renee-wells?fm=webp&q=80",
        },
    },
    {
        quote: "We've really sped up our workflow using Untitled and haven't looked back. We're so happy!",
        author: {
            name: "Sienna Hewitt",
            title: "Project Manager, Warpspeed",
            avatarUrl: "https://www.untitledui.com/images/avatars/sienna-hewitt?fm=webp&q=80",
        },
    },

    {
        quote: "Untitled has saved us thousands of hours of work. We're able to spin up projects and features faster.",
        author: {
            name: "Lulu Meyers",
            title: "PM, Hourglass",
            avatarUrl: "https://www.untitledui.com/images/avatars/lulu-meyers?fm=webp&q=80",
        },
    },
];

const TestimonialCardSplitImage = () => {
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

    const transition: Transition = {
        type: "spring",
        duration: 0.8,
    };

    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="grid grid-cols-1 items-center overflow-hidden rounded-2xl bg-secondary md:rounded-3xl lg:grid-cols-[auto_auto]">
                    <div className="flex flex-1 flex-col gap-8 px-6 py-10 md:gap-8 md:px-8 md:py-12 lg:p-16">
                        <figure className="flex flex-col gap-8">
                            <div className="flex flex-col gap-4 md:gap-6">
                                <AnimatePresence initial={false} mode="popLayout">
                                    <motion.div key={currentReviewIndex + "-rating"} aria-hidden="true" className="flex gap-1">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <motion.div
                                                key={`${currentReviewIndex}-${index}`}
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 6,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                    transition: {
                                                        ...transition,
                                                        delay: 0.5 + index * 0.1,
                                                    },
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 6,
                                                    transition: {
                                                        ...transition,
                                                        delay: 0.12,
                                                    },
                                                }}
                                                className="will-change-transform"
                                            >
                                                <StarIcon />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                    <motion.blockquote
                                        key={currentReviewIndex + "-quote"}
                                        initial={{
                                            opacity: 0,
                                            scale: 0.99,
                                            y: 12,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            y: 0,
                                            transition: {
                                                ...transition,
                                                delay: 0.4,
                                            },
                                        }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.99,
                                            y: 12,
                                            transition: {
                                                ...transition,
                                                delay: 0.06,
                                            },
                                        }}
                                        className="origin-bottom-left text-display-xs font-medium text-balance text-primary will-change-transform sm:text-display-sm md:text-display-md"
                                    >
                                        {reviews[currentReviewIndex].quote}
                                    </motion.blockquote>
                                </AnimatePresence>
                            </div>
                            <AnimatePresence initial={false} mode="popLayout">
                                <motion.figcaption
                                    key={currentReviewIndex}
                                    initial={{
                                        opacity: 0,
                                        scale: 0.99,
                                        y: 12,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        y: 0,
                                        transition: {
                                            ...transition,
                                            delay: 0.3,
                                        },
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.99,
                                        y: 12,
                                        transition,
                                    }}
                                    className="flex origin-bottom-left flex-col gap-1 will-change-transform"
                                >
                                    <p className="text-lg font-semibold text-primary">— {reviews[currentReviewIndex].author.name}</p>
                                    <cite className="text-md text-tertiary not-italic">{reviews[currentReviewIndex].author.title}</cite>
                                </motion.figcaption>
                            </AnimatePresence>
                        </figure>
                        <PaginationDot page={currentReviewIndex + 1} total={3} size="lg" onPageChange={(page) => setCurrentReviewIndex(page - 1)} />
                    </div>
                    <div className="relative flex h-70 w-full items-center justify-center overflow-hidden sm:h-full sm:min-h-90 lg:min-h-112 lg:w-120">
                        <img
                            alt="Mathilde Lewis"
                            src="https://www.untitledui.com/images/portraits/annie-stanley"
                            className="absolute inset-0 size-full object-cover"
                        />
                        <span className="absolute flex size-full items-center justify-center">
                            <PlayButtonIcon className="size-16" />
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

const CTAAbstractImages = () => {
    return (
        <section className="bg-primary py-16 lg:py-24">
            <div className="mx-auto grid max-w-container grid-cols-1 gap-16 overflow-hidden px-4 md:px-8 lg:grid-cols-2 lg:items-center">
                <div className="flex max-w-3xl flex-col items-start">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md lg:text-display-lg">No long-term contracts. No catches.</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-6 md:text-xl">Start your 30-day free trial today.</p>

                    <div className="mt-8 flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-start md:mt-12">
                        <Button color="secondary" size="xl">
                            Learn more
                        </Button>
                        <Button size="xl">Get started</Button>
                    </div>
                </div>

                <div className="grid h-122 w-[150%] grid-cols-[repeat(12,1fr)] grid-rows-[repeat(12,1fr)] gap-2 justify-self-center sm:h-124 sm:w-[120%] md:w-auto md:gap-4">
                    <img
                        src="https://www.untitledui.com/marketing/abstract-image-01.webp"
                        className="size-full object-cover"
                        alt="Alisa Hester"
                        style={{ gridArea: "3 / 3 / 7 / 7" }}
                    />
                    <img
                        src="https://www.untitledui.com/marketing/abstract-image-02.webp"
                        className="size-full object-cover"
                        alt="Alisa Hester"
                        style={{ gridArea: "1 / 7 / 7 / 11" }}
                    />
                    <img
                        src="https://www.untitledui.com/marketing/abstract-image-03.webp"
                        className="size-full object-cover"
                        alt="Alisa Hester"
                        style={{ gridArea: "7 / 5 / 13 / 9" }}
                    />
                    <img
                        src="https://www.untitledui.com/marketing/abstract-image-04.webp"
                        className="size-full object-cover"
                        alt="Alisa Hester"
                        style={{ gridArea: "7 / 9 / 10 / 13" }}
                    />
                    <img
                        src="https://www.untitledui.com/marketing/smiling-girl-2.webp"
                        className="size-full object-cover"
                        alt="Alisa Hester"
                        style={{ gridArea: "7 / 1 / 10 / 5" }}
                    />
                </div>
            </div>
        </section>
    );
};

const footerNavList = [
    {
        label: "Product",
        items: [
            { label: "Overview", href: "#" },
            { label: "Features", href: "#" },
            {
                label: "Solutions",
                href: "#",
                badge: (
                    <Badge color="gray" type="modern" size="sm" className="ml-1">
                        New
                    </Badge>
                ),
            },
            { label: "Tutorials", href: "#" },
            { label: "Pricing", href: "#" },
            { label: "Releases", href: "#" },
        ],
    },
    {
        label: "Company",
        items: [
            { label: "About us", href: "#" },
            { label: "Careers", href: "#" },
            { label: "Press", href: "#" },
            { label: "News", href: "#" },
            { label: "Media kit", href: "#" },
            { label: "Contact", href: "#" },
        ],
    },
    {
        label: "Resources",
        items: [
            { label: "Blog", href: "#" },
            { label: "Newsletter", href: "#" },
            { label: "Events", href: "#" },
            { label: "Help centre", href: "#" },
            { label: "Tutorials", href: "#" },
            { label: "Support", href: "#" },
        ],
    },
    {
        label: "Social",
        items: [
            { label: "Twitter", href: "#" },
            { label: "LinkedIn", href: "#" },
            { label: "Facebook", href: "#" },
            { label: "GitHub", href: "#" },
            { label: "AngelList", href: "#" },
            { label: "Dribbble", href: "#" },
        ],
    },
    {
        label: "Legal",
        items: [
            { label: "Terms", href: "#" },
            { label: "Privacy", href: "#" },
            { label: "Cookies", href: "#" },
            { label: "Licenses", href: "#" },
            { label: "Settings", href: "#" },
            { label: "Contact", href: "#" },
        ],
    },
];

const footerSocials = [
    { label: "X (formerly Twitter)", icon: X, href: "https://x.com/" },
    { label: "LinkedIn", icon: LinkedIn, href: "https://www.linkedin.com/" },
    { label: "Facebook", icon: Facebook, href: "https://www.facebook.com/" },
    { label: "GitHub", icon: GitHub, href: "https://github.com/" },
    { label: "AngelList", icon: AngelList, href: "https://angel.co/" },
    { label: "Dribbble", icon: Dribbble, href: "https://dribbble.com/" },
    { label: "Layers", icon: Layers, href: "https://layers.com/" },
];

const FooterLarge12 = () => {
    return (
        <footer className="bg-primary">
            <div className="bg-secondary_alt py-10 md:py-12">
                <div className="mx-auto max-w-container px-4 md:px-8">
                    <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
                        <div className="flex flex-col gap-2 md:gap-4">
                            <p id="newsletter-label" className="text-display-xs font-semibold text-primary md:text-display-sm">
                                Get notified when we launch
                            </p>
                            <p id="newsletter-hint" className="text-md text-tertiary md:text-xl">
                                Stay up to date with the latest news, announcements, and articles.
                            </p>
                        </div>
                        <Form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const data = Object.fromEntries(new FormData(e.currentTarget));
                                console.log("Form data:", data);
                            }}
                            className="w-full sm:w-100"
                        >
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Input
                                    isRequired
                                    aria-labelledby="newsletter-label"
                                    aria-describedby="newsletter-hint"
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    size="md"
                                    wrapperClassName="flex-1"
                                />
                                <Button type="submit" size="lg">
                                    Subscribe
                                </Button>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-container px-4 py-12 md:px-8 md:pt-16">
                <div className="flex flex-col gap-12 md:gap-16 xl:flex-row">
                    <div className="flex flex-col gap-6 md:w-80 md:gap-8">
                        <UntitledLogo className="h-8 w-min shrink-0" />
                        <p className="text-md text-tertiary">Design amazing digital experiences that create more happy in the world.</p>
                    </div>
                    <nav className="flex-1">
                        <ul className="grid flex-1 grid-cols-2 gap-8 md:grid-cols-5">
                            {footerNavList.slice(0, 5).map((category) => (
                                <li key={category.label}>
                                    <h4 className="text-sm font-semibold text-quaternary">{category.label}</h4>
                                    <ul className="mt-4 flex flex-col gap-3">
                                        {category.items.map((item) => (
                                            <li key={item.label}>
                                                <Button color="link-gray" size="lg" href={item.href} iconTrailing={item.badge} className="gap-1">
                                                    {item.label}
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className="mt-12 flex flex-col-reverse justify-between gap-6 border-t border-secondary pt-8 md:mt-16 md:flex-row">
                    <p className="text-md text-quaternary">© 2077 Untitled UI. All rights reserved.</p>
                    <ul className="flex gap-6">
                        {footerSocials.map(({ label, icon: Icon, href }) => (
                            <li key={label}>
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex rounded-xs text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
                                >
                                    <Icon size={24} aria-label={label} />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    );
};

const LandingPage20 = () => {
    return (
        <div className="bg-primary">
            <HeroSplitImage03 />

            <SocialProofCard />

            <FeaturesTabsMockup06 />

            <MetricsCardGrayLight />

            <CTASimpleLeft />

            <PricingSectionSimpleCards02 />

            <SectionDivider />

            <TestimonialCardSplitImage />

            <CTAAbstractImages />

            <FooterLarge12 />
        </div>
    );
};

export default LandingPage20;
